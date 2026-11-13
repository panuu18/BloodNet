import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const badgeVariants = {
  status: {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    accepted: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    critical: "bg-red-600 text-white border-red-700 animate-pulse font-bold",
    emergency: "bg-red-500 text-white border-red-600",
    urgent: "bg-orange-500 text-white border-orange-600",
    normal: "bg-gray-100 text-gray-800 border-gray-200",
  },
  bloodGroup: {
    "A+": "bg-purple-100 text-purple-800 border-purple-200",
    "A-": "bg-purple-100 text-purple-800 border-purple-200",
    "B+": "bg-pink-100 text-pink-800 border-pink-200",
    "B-": "bg-pink-100 text-pink-800 border-pink-200",
    "AB+": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "AB-": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "O+": "bg-red-100 text-red-800 border-red-200",
    "O-": "bg-red-100 text-red-800 border-red-200",
  },
  priority: {
    low: "bg-gray-100 text-gray-800 border-gray-200",
    medium: "bg-blue-100 text-blue-800 border-blue-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    urgent: "bg-red-500 text-white border-red-600",
  }
};

const badgeSizes = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

const Badge = React.forwardRef(({ 
  className, 
  variant = "status", 
  size = "md", 
  children, 
  type = "pending",
  ...props 
}, ref) => {
  const variantClass = badgeVariants[variant]?.[type] || badgeVariants.status.pending;
  const sizeClass = badgeSizes[size];

  return (
    <motion.span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium",
        variantClass,
        sizeClass,
        className
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.span>
  );
});

export const StatusBadge = ({ status, size = "md", className }) => {
  return (
    <Badge variant="status" type={status} size={size} className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const BloodGroupBadge = ({ bloodGroup, size = "md", className }) => {
  return (
    <Badge variant="bloodGroup" type={bloodGroup} size={size} className={className}>
      {bloodGroup}
    </Badge>
  );
};

export const UrgencyBadge = ({ urgency, size = "md", className }) => {
  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'critical': return '🚨 Critical';
      case 'emergency': return '🚨 Emergency';
      case 'urgent': return '⚡ Urgent';
      case 'normal': return 'Normal';
      default: return urgency;
    }
  };

  return (
    <Badge variant="status" type={urgency} size={size} className={className}>
      {getUrgencyText(urgency)}
    </Badge>
  );
};

export const PriorityBadge = ({ priority, size = "md", className }) => {
  return (
    <Badge variant="priority" type={priority} size={size} className={className}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

export { Badge };
