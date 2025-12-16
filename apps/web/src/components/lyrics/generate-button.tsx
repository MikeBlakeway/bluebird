'use client'

import React from 'react'
import { Button, type ButtonProps } from '@heroui/react'
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
  isDisabled,
  className,
  type = 'button',
  ...props
}: GenerateButtonProps) {
  return (
    <Button
      type={type}
      isLoading={isLoading}
      isDisabled={isLoading || isDisabled}
      color="primary"
      size="lg"
      className={cn(className)}
      {...props}
    >
      {isLoading ? loadingText : children}
    </Button>
  )
}
