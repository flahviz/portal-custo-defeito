import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
  className
}: MetricCardProps) {
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return 'border-success/20 bg-gradient-to-br from-success/5 to-success/10';
      case 'warning':
        return 'border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10';
      case 'danger':
        return 'border-danger/20 bg-gradient-to-br from-danger/5 to-danger/10';
      default:
        return 'border-primary/20 bg-gradient-card';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'danger':
        return 'text-danger';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card className={cn(
      "p-6 shadow-card transition-all duration-200 hover:shadow-elegant",
      getVariantColors(),
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {value}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-danger"
              )}>
                {trend.isPositive ? "↗" : "↘"} {trend.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-2 rounded-lg",
            getIconColor(),
            variant === 'default' ? 'bg-primary/10' : 
            variant === 'success' ? 'bg-success/10' :
            variant === 'warning' ? 'bg-warning/10' :
            'bg-danger/10'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}