import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io } from 'socket.io-client';
import { notificationAPI } from '../services/api';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case 'NEW_BLOOD_REQUEST':
      return {
        ...state,
        newBloodRequest: action.payload
      };
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        loading: false
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif._id === action.payload ? { ...notif, isRead: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
        unreadCount: 0
      };
    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif._id !== action.payload),
        unreadCount: state.notifications.find(notif => notif._id === action.payload)?.isRead === false 
          ? state.unreadCount - 1 
          : state.unreadCount
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_SOCKET':
      return {
        ...state,
        socket: action.payload
      };
    default:
      return state;
  }
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  socket: null,
  newBloodRequest: null
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = io('http://localhost:5000', {
        auth: {
          token
        }
      });

      socket.on('connect', () => {
        console.log('Connected to socket server');
        dispatch({ type: 'SET_SOCKET', payload: socket });
      });

      socket.on('newNotification', (notification) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      });

      socket.on('newBloodRequest', (data) => {
        console.log('New blood request received:', data);
        dispatch({ type: 'NEW_BLOOD_REQUEST', payload: data });
      });

      socket.on('requestUpdate', (data) => {
        console.log('Request update received:', data);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationAPI.getNotifications({ limit: 50 });
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data.notifications });
        
        const unreadResponse = await notificationAPI.getUnreadCount();
        dispatch({ type: 'SET_UNREAD_COUNT', payload: unreadResponse.data.unreadCount });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
    }
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const value = {
    ...state,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
