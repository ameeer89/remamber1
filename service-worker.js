// service-worker.js
const CACHE_NAME = 'salary-reminder-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  // تثبيت Service Worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  // استعادة المحتوى من الكاش إن وجد
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  // تنظيف الكاش القديم
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// معالجة الإشعارات
self.addEventListener('push', function(event) {
  const options = {
    body: 'حان موعد استلام الحوافز الشهرية.',
    icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'received',
        title: 'تم الاستلام'
      },
      {
        action: 'postpone',
        title: 'تذكير لاحقاً'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('تذكير استلام الحوافز', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'received') {
    // إرسال رسالة إلى التطبيق للإشارة إلى أنه تم استلام الحافز
    clients.matchAll().then(function(clientList) {
      if (clientList.length > 0) {
        clientList[0].postMessage({
          action: 'received'
        });
      }
    });
  } else if (event.action === 'postpone') {
    // إرسال رسالة إلى التطبيق لتأجيل التذكير
    clients.matchAll().then(function(clientList) {
      if (clientList.length > 0) {
        clientList[0].postMessage({
          action: 'postpone'
        });
      }
    });
  } else {
    // فتح التطبيق عند النقر على الإشعار نفسه
    event.waitUntil(
      clients.matchAll({
        type: 'window'
      })
      .then(function(clientList) {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});