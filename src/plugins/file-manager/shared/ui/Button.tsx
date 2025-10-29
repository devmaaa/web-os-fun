import { Component } from 'solid-js';
import { cn } from '../../../../utils/cn';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: any;
  class?: string;
}

const Button: Component<ButtonProps> = (props) => {
  const baseClasses = 'inline-flex items-center justify-center border-none rounded-md font-medium cursor-pointer transition-all duration-200 font-family outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2';

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg',
    secondary: 'bg-surface text-foreground border border-border hover:bg-muted hover:border-accent',
    danger: 'bg-error text-error-foreground hover:bg-error/90 hover:-translate-y-0.5 hover:shadow-lg'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[36px]',
    lg: 'px-6 py-3 text-base min-h-[44px]'
  };

  const disabledClasses = props.disabled ? 'opacity-60 cursor-not-allowed hover:transform-none hover:shadow-none' : '';

  const classes = cn(
    baseClasses,
    variantClasses[props.variant || 'primary'],
    sizeClasses[props.size || 'md'],
    disabledClasses,
    props.class
  );

  return (
    <button
      class={classes}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export default Button;