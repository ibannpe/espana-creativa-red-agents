import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ModernCard({ className, children, ...props }: ModernCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  iconColor?: string
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  iconColor = 'bg-blue-50' 
}: MetricCardProps) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <ModernCard>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {value}
          </p>
          {change && (
            <p className={cn("text-sm font-medium flex items-center", changeColors[changeType])}>
              {changeType === 'positive' && <span className="text-green-500 mr-1">+</span>}
              {changeType === 'negative' && <span className="text-red-500 mr-1">-</span>}
              {change}
            </p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColor)}>
          {icon}
        </div>
      </div>
    </ModernCard>
  )
}

interface ActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  iconColor?: string
  onClick?: () => void
  href?: string
}

export function ActionCard({ 
  title, 
  description, 
  icon, 
  iconColor = 'bg-blue-50',
  onClick,
  href
}: ActionCardProps) {
  const CardContent = (
    <div className="group p-5 bg-gray-50 hover:bg-white rounded-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:shadow-md cursor-pointer">
      <div className="flex items-center">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all duration-300",
          iconColor,
          "group-hover:scale-110"
        )}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href}>
        {CardContent}
      </Link>
    )
  }

  return (
    <div onClick={onClick}>
      {CardContent}
    </div>
  )
}