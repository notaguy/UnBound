import "./Logo.css";

export const LOGO_SRC = `${import.meta.env.BASE_URL}logo.webp`;

type LogoProps = {
  className?: string;
  alt?: string;
};

export default function Logo({ className, alt = "INGENIUM" }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={className ? `logo ${className}` : "logo"}
      decoding="async"
    />
  );
}
