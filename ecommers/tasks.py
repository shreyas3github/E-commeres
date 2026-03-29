import logging
import random
from celery import shared_task
from django.db import transaction
from .models import Order, ProductVariant

# We use the ecommers logger defined in settings.py to map to the JSON formatter
logger = logging.getLogger('ecommers.tasks')

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_order_task(self, order_id):
    """
    Background worker task to reliably process orders, satisfying requirements:
    - Phase 3: Retry mechanism up to 3 times, randomized failure testing.
    - Phase 5: Concurrent pessimistic locking for inventory consistency.
    - Phase 6: Structured state & failure logging.
    """
    logger.info({"message": "Picked up order for processing", "order_id": order_id})
    
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        logger.error({"message": "Order not found in DB immediately following checkout.", "order_id": order_id})
        return "Order Not Found"

    # Idempotence protection: if picked up again for some reason, ignore if not pending
    if order.status != 'pending':
        logger.warning({
            "message": "Order already processed or processing, skipping duplicate execution.", 
            "order_id": order_id, 
            "current_status": order.status
        })
        return "Skipped (Idempotent)"

    order.status = 'processing'
    order.save(update_fields=['status'])

    # ==========================================
    # 1. PAYMENT SIMULATION (30% Random Failure)
    # ==========================================
    logger.info({
        "message": "Starting Payment Simulation", 
        "order_id": order_id, 
        "attempt": order.payment_retries + 1
    })
    
    is_payment_success = random.random() > 0.3
    if not is_payment_success:
        order.payment_retries += 1
        order.failure_reason = 'Payment Gateway Timeout Simulated'
        order.status = 'pending' # Revert to pending to allow retry to pick it up properly
        order.save(update_fields=['payment_retries', 'failure_reason', 'status'])
        
        logger.warning({
            "message": "Payment simulation failed randomly", 
            "order_id": order_id, 
            "retries": order.payment_retries
        })
        
        if order.payment_retries >= self.max_retries:
            order.status = 'payment_failed'
            order.save(update_fields=['status'])
            return "Failed permanently due to payment simulation limits"
        
        # Throwing the retry exception
        raise self.retry(exc=Exception("Payment simulation failed randomly"))


    # ==========================================
    # 2. INVENTORY CHECK & CONCURRENCY
    # ==========================================
    logger.info({
        "message": "Starting Inventory Verification & Locking", 
        "order_id": order_id, 
        "attempt": order.inventory_retries + 1
    })
    
    # 20% Random failure for inventory check processing (not related to actual stock limits)
    is_inventory_success = random.random() > 0.2
    if not is_inventory_success:
        order.inventory_retries += 1
        order.failure_reason = 'Inventory DB Lock Timeout Simulated'
        order.status = 'pending' 
        order.save(update_fields=['inventory_retries', 'failure_reason', 'status'])
        
        logger.warning({
            "message": "Inventory check processing failed randomly", 
            "order_id": order_id, 
            "retries": order.inventory_retries
        })
        
        if order.inventory_retries >= self.max_retries:
            order.status = 'inventory_failed'
            order.save(update_fields=['status'])
            return "Failed permanently due to simulated inventory constraints"
        
        raise self.retry(exc=Exception("Inventory processing simulated failure"))

    # Actual Concurrency Control (Phase 5)
    try:
        # Atomic block guarantees that if any part of the deduction fails, 
        # all database changes in this block are rolled back.
        with transaction.atomic():
            order_items = order.items.all()
            for item in order_items:
                # select_for_update() enforces a pessimistic lock at the database row level.
                # If 10 concurrent requests arrive for this ProductVariant, they queue up here.
                # The first one locks the row, evaluates stock, deducts, and releases on commit.
                # The others wait milliseconds for the lock to release, then evaluate the newly updated stock.
                variant = ProductVariant.objects.select_for_update().get(id=item.product_variant.id)
                
                if variant.stock < item.quantity:
                    raise ValueError(f"Insufficient stock for {variant.name}. Requested {item.quantity}, have {variant.stock}")
                
                variant.stock -= item.quantity
                variant.save(update_fields=['stock'])
                
                logger.info({
                    "message": "Locked row and deducted inventory", 
                    "order_id": order_id, 
                    "variant_id": variant.id, 
                    "remaining_stock": variant.stock
                })
        
        # If execution reaches here, payment succeeded and inventory was successfully deducted free of race conditions.
        order.status = 'confirmed'
        order.failure_reason = None
        order.save(update_fields=['status', 'failure_reason'])
        
        logger.info({
            "message": "Order successfully confirmed and finalized", 
            "order_id": order_id
        })
        return "Success"
        
    except ValueError as e:
        # Business Logic Failure (Hard Fail, no retries for OOS)
        order.status = 'inventory_failed'
        order.failure_reason = str(e)
        order.save(update_fields=['status', 'failure_reason'])
        
        logger.error({
            "message": "Order failed due to insufficient true stock during lock", 
            "order_id": order_id, 
            "error": str(e)
        })
        return "Failed due to Out of Stock"
        
    except Exception as e:
        # Genuine systemic DB errors during lock
        order.inventory_retries += 1
        order.failure_reason = f"System Exception: {str(e)}"
        order.status = 'pending'
        order.save(update_fields=['inventory_retries', 'failure_reason', 'status'])
        raise self.retry(exc=e)
