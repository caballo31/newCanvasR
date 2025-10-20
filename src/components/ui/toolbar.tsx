import React from 'react'
import { cn } from '../../lib/utils'

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-1 p-2 bg-background border-b border-border', className)}
      {...props}
    />
  )
})
Toolbar.displayName = 'Toolbar'

const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('flex items-center gap-1', className)} {...props} />
  }
)
ToolbarGroup.displayName = 'ToolbarGroup'

export { Toolbar, ToolbarGroup }
