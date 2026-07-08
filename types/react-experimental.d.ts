// react@experimental は View Transitions 用の `ViewTransition` をランタイムでは export しているが、
// @types/react (安定版) にはまだ型定義がないため、ここで補完する。
import type { ReactNode } from "react";

declare module "react" {
  interface ViewTransitionProps {
    children?: ReactNode;
    name?: string;
    className?: string;
  }

  export const ViewTransition: (props: ViewTransitionProps) => ReactNode;

  interface CSSProperties {
    viewTransitionName?: string;
  }
}
