import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Explore Map", href: "/#map" },
      { label: "Compare", href: "/compare" },
      { label: "Search", href: "/#search" },
      { label: "State Data", href: "/#map" },
    ],
  },
  {
    title: "Data Sources",
    links: [
      { label: "Bureau of Economic Analysis", href: "#" },
      { label: "HUD Fair Market Rents", href: "#" },
      { label: "Bureau of Labor Statistics", href: "#" },
      { label: "EIA Energy Data", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How It Works", href: "#" },
      { label: "API Documentation", href: "#" },
      { label: "Methodology", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Data Attribution", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="border-t pt-16 pb-8 px-6 md:px-8"
      style={{ borderColor: "var(--lux-border)" }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div
          className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: "var(--lux-border)" }}
        >
          <span className="text-[var(--text-primary)] font-bold">
            COSTWISE
          </span>
          <span className="text-sm text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} CostWise. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
