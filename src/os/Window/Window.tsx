import { useId, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { accentClass, type Accent } from '../accent';
import './Window.css';

type WindowProps = {
  title: string;
  accent?: Accent;
  /** The focused window gets a stronger shadow and its title bar in full color. */
  active?: boolean;
  /** A red title bar, for Access denied. */
  danger?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  /** Spread onto the title bar. The window manager uses this for dragging. */
  titleBarProps?: HTMLAttributes<HTMLDivElement>;
  /** Spread onto the window root. The window manager uses this for focus and clicks. */
  rootProps?: HTMLAttributes<HTMLElement>;
  ref?: Ref<HTMLElement>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function Window({
  title,
  accent = 'yellow',
  active = true,
  danger = false,
  onClose,
  onMinimize,
  titleBarProps,
  rootProps,
  ref,
  className = '',
  style,
  children,
}: WindowProps) {
  const titleId = useId();

  return (
    <section
      {...rootProps}
      ref={ref}
      className={`win ${accentClass(accent)} ${className}`}
      data-active={active}
      data-danger={danger}
      aria-labelledby={titleId}
      style={style}
    >
      <div {...titleBarProps} className={`win__bar ${titleBarProps?.className ?? ''}`}>
        <div className="win__controls">
          {onClose && (
            <button
              type="button"
              className="win__control win__control--close"
              onClick={onClose}
              aria-label={`Close ${title}`}
            >
              <svg viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
              </svg>
            </button>
          )}
          {onMinimize && (
            <button
              type="button"
              className="win__control"
              onClick={onMinimize}
              aria-label={`Minimize ${title}`}
            >
              <svg viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2.5 8h5" />
              </svg>
            </button>
          )}
        </div>
        <h2 id={titleId} className="win__title">
          {title}
        </h2>
      </div>
      <div className="win__body">{children}</div>
    </section>
  );
}
