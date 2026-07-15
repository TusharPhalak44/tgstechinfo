import * as React from "react"
import { cn } from "@/lib/utils"

const AuthCard = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-h-screen w-full",
      className
    )}
    {...props}
  />
))
AuthCard.displayName = "AuthCard"

const AuthContainer = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full max-w-[400px] md:max-w-md space-y-6",
      className
    )}
    {...props}
  />
))
AuthContainer.displayName = "AuthContainer"

const AuthHeader = React.forwardRef(({ className, title, description, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2 text-center", className)} {...props}>
    <h1 className="text-3xl font-bold tracking-tight text-[var(--color-heading)]">{title}</h1>
    {description && <p className="text-sm text-[var(--color-muted)]">{description}</p>}
  </div>
))
AuthHeader.displayName = "AuthHeader"

const AuthForm = React.forwardRef(({ className, children, ...props }, ref) => (
  <form ref={ref} className={cn("space-y-4", className)} {...props}>
    {children}
  </form>
))
AuthForm.displayName = "AuthForm"

const AuthFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-4", className)} {...props}>
    {children}
  </div>
))
AuthFooter.displayName = "AuthFooter"

const AuthDivider = React.forwardRef(({ className, text, ...props }, ref) => (
  <div ref={ref} className={cn("relative", className)} {...props}>
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-[var(--color-border)]" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-[var(--color-surface)] px-2 text-[var(--color-muted)] font-semibold">{text}</span>
    </div>
  </div>
))
AuthDivider.displayName = "AuthDivider"

const AuthSocial = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("grid grid-cols-2 gap-4", className)} {...props}>
    {children}
  </div>
))
AuthSocial.displayName = "AuthSocial"

export { AuthCard, AuthContainer, AuthHeader, AuthForm, AuthFooter, AuthDivider, AuthSocial }
