// The Shipments module runs on the Uber theme (see `.uber` in globals.css).
export default function ShipmentsLayout({ children }: LayoutProps<"/shipments">) {
  return <div className="uber -mx-4 -my-6 min-h-full bg-background px-4 py-6 text-foreground sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">{children}</div>;
}
