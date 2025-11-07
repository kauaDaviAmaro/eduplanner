'use client'

import { useState } from 'react'
import type { Notification } from '@/lib/queries/dashboard'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/dashboard'

interface NotificationsPanelProps {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationsPanel({
  notifications,
  unreadCount,
}: NotificationsPanelProps) {
  const [localNotifications, setLocalNotifications] = useState(notifications)
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount)

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId)
    if (result.success) {
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setLocalUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if (result.success) {
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setLocalUnreadCount(0)
    }
  }

  const unreadNotifications = localNotifications.filter((n) => !n.is_read)
  const readNotifications = localNotifications.filter((n) => n.is_read)

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-gray-900">Notificações</h3>
          {localUnreadCount > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
              {localUnreadCount}
            </span>
          )}
        </div>
        {localUnreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {localNotifications.length === 0 && (
        <p className="text-gray-600 text-sm">Nenhuma notificação.</p>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {unreadNotifications.map((notification) => (
          <div
            key={notification.id}
            className="p-4 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
            onClick={() => handleMarkAsRead(notification.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-purple-600 ml-2 flex-shrink-0 mt-1" />
            </div>
          </div>
        ))}

        {readNotifications.map((notification) => (
          <div
            key={notification.id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-75"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-700 mb-1">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
