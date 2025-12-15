'use client'

import React from 'react'
import { Button, type ButtonProps } from '@bluebird/ui'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerateButtonProps extends Omit<ButtonProps, 'type'> {
  isLoading?: boolean
  loadingText?: string
  children?: React.ReactNode
  type?: 'submit' | 'button' | 'reset'
}

export function GenerateButton({
  isLoading,
  loadingText = 'Generating...',
  children = 'Generate Preview',
  disabled,
  className,
  type = 'button',
  ...props
}: GenerateButtonProps) {
  return (
    <Button
      type={type}
      disabled={isLoading || disabled}
      className={cn('gap-2', className)}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      <span>{isLoading ? loadingText : children}</span>
    </Button>
  )
}
