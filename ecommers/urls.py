from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'addresses', views.AddressViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'variants', views.ProductVariantViewSet)
router.register(r'carts', views.CartViewSet)
router.register(r'cart-items', views.CartItemViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'reviews', views.ReviewViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # Frontend Home
    path('', views.home, name='home'),
    
    # API Endpoints
    path('api/', include(router.urls)),
    
    # Razorpay Endpoints
    path('api/razorpay/create/', views.CreateRazorpayOrderView.as_view(), name='razorpay-create'),
    path('api/razorpay/verify/', views.VerifyRazorpayPaymentView.as_view(), name='razorpay-verify'),
]
