import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
} from "react";

// StarBorder, de React Bits. Los colores apuntan a variables CSS
// (--star-*) para que cada variante decida los suyos en globals.css,
// hovers incluidos. Las estelas van dentro de un anillo recortado al
// borde: la luz recorre el trazo del botón, no flota fuera de él.

type StarBorderProps<T extends ElementType> = {
  as?: T;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "className" | "color" | "style" | "children"
>;

export function StarBorder<T extends ElementType = "button">({
  as,
  className = "",
  color = "var(--star-color)",
  speed = "6s",
  thickness = 1,
  backgroundColor = "var(--star-bg)",
  textColor = "var(--star-text)",
  borderColor = "var(--star-border)",
  style,
  children,
  ...rest
}: StarBorderProps<T>) {
  const Component: ElementType = as || "button";
  const star = {
    background: `radial-gradient(circle, ${color}, transparent 10%)`,
    animationDuration: speed,
  };
  // Spans y no divs: el contenedor puede ser un <button>.
  return (
    <Component
      className={`star-border-container ${className}`.trim()}
      style={style}
      {...rest}
    >
      <span
        className="inner-content"
        style={{ background: backgroundColor, color: textColor, borderColor }}
      >
        {children}
      </span>
      <span
        className="star-border-ring"
        style={{ padding: `${thickness}px` }}
        aria-hidden="true"
      >
        <span className="border-gradient-bottom" style={star} />
        <span className="border-gradient-top" style={star} />
      </span>
    </Component>
  );
}
