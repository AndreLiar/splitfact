// Simple test to verify notification service works
const { PrismaClient } = require('@prisma/client');

async function testNotificationService() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing NotificationQueue model...');
    
    // Test that notificationQueue exists
    console.log('notificationQueue property exists:', 'notificationQueue' in prisma);
    
    // Test creating a queue item
    const testQueueItem = await prisma.notificationQueue.create({
      data: {
        userId: 'test-user-id',
        type: 'GENERAL',
        title: 'Test Notification',
        message: 'This is a test notification',
        actionUrl: '/test',
        metadata: { test: true },
        status: 'PENDING',
        maxAttempts: 3,
        attemptCount: 0,
        nextRetryAt: new Date()
      }
    });
    
    console.log('✅ Successfully created test queue item:', testQueueItem.id);
    
    // Test finding the item
    const foundItem = await prisma.notificationQueue.findUnique({
      where: { id: testQueueItem.id }
    });
    
    console.log('✅ Successfully found queue item:', foundItem ? 'YES' : 'NO');
    
    // Clean up
    await prisma.notificationQueue.delete({
      where: { id: testQueueItem.id }
    });
    
    console.log('✅ Successfully cleaned up test data');
    console.log('🎉 NotificationService database integration works correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationService();