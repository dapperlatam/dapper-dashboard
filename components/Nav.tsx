"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOGO_DARK, LOGO_LIGHT } from "@/lib/brand";
import { ThemeToggle } from "./ThemeToggle";

const ITEMS = [
  { href: "/", label: "Resumen" },
  { href: "/meta/1", label: "Meta 1" },
  { href: "/meta/2", label: "Meta 2" },
  { href: "/meta/3", label: "Meta 3" },
  { href: "/meta/4", label: "Meta 4" },
  { href: "/meta/5", label: "Meta 5" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="topbar">
      <div className="topbar-in">
        <Link href="/" className="brand" aria-label="Dapper, resumen de metas">
          {LOGO_LIGHT ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_LIGHT} alt="Dapper" className={LOGO_DARK ? "logo logo-light" : "logo"} />
              {LOGO_DARK ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={LOGO_DARK} alt="" aria-hidden="true" className="logo logo-dark" />
              ) : null}
            </>
          ) : (
            <>
              <span className="brand-mark">D</span>
              <span>Dapper</span>
            </>
          )}
        </Link>
        <nav className="nav" aria-label="Metas">
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} className={path === i.href ? "on" : ""}>
              {i.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
