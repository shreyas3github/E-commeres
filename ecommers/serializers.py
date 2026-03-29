from rest_framework import serializers
from .models import (
    User, Address, Category, Product, ProductImage, ProductVariant,
    Cart, CartItem, Order, OrderItem, Payment, Review
)

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'first_name', 'last_name', 'password']
        read_only_fields = ['id']
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        username = validated_data.get('username')
        if not username:
            username = validated_data.get('email', '').split('@')[0]
            
        user = User.objects.create_user(
            email=validated_data['email'],
            username=username,
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

# Address Serializer
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

# Category Serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

# Product Image Serializer
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text']

# Product Variant Serializer
class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'

# Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'category', 'category_name', 'price', 'is_active', 'images', 'variants', 'created_at', 'updated_at']

# Cart Item Serializer
class CartItemSerializer(serializers.ModelSerializer):
    variant_details = ProductVariantSerializer(source='product_variant', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'cart', 'product_variant', 'variant_details', 'quantity']

# Cart Serializer
class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'created_at']

# Order Item Serializer
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product_variant.product.name')
    product_price = serializers.ReadOnlyField(source='product_variant.price')
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product_variant', 'product_name', 'product_price', 'product_image', 'quantity', 'price']

    def get_product_image(self, obj):
        if obj.product_variant and obj.product_variant.product.images.exists():
            image = obj.product_variant.product.images.first().image.url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image)
            return image
        return None

# Order Serializer
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.ReadOnlyField(source='user.email')
    address_details = AddressSerializer(source='address', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_email', 'address', 'address_details', 'status', 'total_price', 'items', 'created_at', 'updated_at']
        read_only_fields = ['user', 'items', 'created_at', 'updated_at']

# Payment Serializer
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

# Review Serializer
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'
