"use client";

interface Props {
  action: (formData: FormData) => Promise<void>;
  message: string;
  children: React.ReactNode;
  className?: string;
}

export function ConfirmForm({ action, message, children, className }: Props) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
