from django.shortcuts import render
from rest_framework import viewsets, filters, permissions
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    User, Address, Category, Product, ProductImage, ProductVariant,
    Cart, CartItem, Order, OrderItem, Payment, Review
)
from .serializers import (
    UserSerializer, AddressSerializer, CategorySerializer, ProductSerializer,
    ProductImageSerializer, ProductVariantSerializer, CartSerializer,
    CartItemSerializer, OrderSerializer, OrderItemSerializer,
    PaymentSerializer, ReviewSerializer
)

# User API
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

# Address API
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Address.objects.filter(user=self.request.user).order_by('-created_at')
        return Address.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

# Category API
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    def get_serializer(self, *args, **kwargs):
        # If the data being passed is a list, set many=True
        if isinstance(kwargs.get('data', {}), list):
            kwargs['many'] = True
        return super(CategoryViewSet, self).get_serializer(*args, **kwargs)
# Product API
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']
    def get_serializer(self, *args, **kwargs):
        # Check if the data being passed is a list
        if isinstance(kwargs.get('data', {}), list):
            kwargs['many'] = True
        return super(ProductViewSet, self).get_serializer(*args, **kwargs)


# Product Variant API
class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer

# Cart API
class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

# Cart Item API
class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)

# Order API
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'user']
    ordering_fields = ['created_at']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user).prefetch_related(
                'items', 'items__product_variant', 'items__product_variant__product', 'items__product_variant__product__images'
            ).order_by('-created_at')
        return Order.objects.none()

    def create(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status
        from django.db import transaction
        from .tasks import process_order_task
        
        # 1. Idempotency Check (Phase 4)
        idempotency_key = request.headers.get('Idempotency-Key')
        user = request.user if request.user.is_authenticated else None

        if idempotency_key:
            existing_order = Order.objects.filter(idempotency_key=idempotency_key).first()
            if existing_order:
                # If a client retries the same checkout request due to a network drop,
                # we catch the duplicate Idempotency-Key and safely return the existing order.
                serializer = self.get_serializer(existing_order)
                return Response(serializer.data, status=status.HTTP_200_OK)

        # 2. Validation & Atomic DB Transaction
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            order = serializer.save(user=user, idempotency_key=idempotency_key)
            
            if user and hasattr(user, 'cart'):
                cart_items = user.cart.items.all()
                order_items = []
                for item in cart_items:
                    order_items.append(OrderItem(
                        order=order,
                        product_variant=item.product_variant,
                        quantity=item.quantity,
                        price=item.product_variant.price
                    ))
                if order_items:
                    OrderItem.objects.bulk_create(order_items)
                cart_items.delete()
                
        # 3. Trigger Asynchronous Processing (Phase 3)
        # We fire the background task and immediately release the frontend HTTP response
        process_order_task.delay(str(order.id))
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

# Payment API
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(order__user=self.request.user)

# Review API
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

import razorpay
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({"error": "order_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        amount_in_paise = int(order.total_price * 100)
        
        try:
            razorpay_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": str(order.id)[:40],
                "payment_capture": "1"
            })
            
            return Response({
                "razorpay_order_id": razorpay_order['id'],
                "amount": razorpay_order['amount'],
                "currency": razorpay_order['currency'],
                "key_id": settings.RAZORPAY_KEY_ID
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        ecom_order_id = request.data.get('order_id')

        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature, ecom_order_id]):
            return Response({"error": "Missing required parameters"}, status=status.HTTP_400_BAD_REQUEST)

        order = get_object_or_404(Order, id=ecom_order_id, user=request.user)
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }

        try:
            client.utility.verify_payment_signature(params_dict)
            
            # Signature Verified - Update DB Models
            order.status = 'confirmed'
            order.save()

            Payment.objects.create(
                order=order,
                method='card', 
                status='success',
                transaction_id=razorpay_payment_id
            )

            return Response({"message": "Payment verified successfully"}, status=status.HTTP_200_OK)

        except razorpay.errors.SignatureVerificationError:
            return Response({"error": "Invalid Payment Signature"}, status=status.HTTP_400_BAD_REQUEST)

def home(request):
    """
    Renders the frontend landing page.
    """
    return render(request, 'index.html')