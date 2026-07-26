import React from "react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { urlFor } from "../lib/sanity";
import "./PortableTextRenderer.scss";

interface Props {
  value: any;
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <img
          alt={value.alt || "Zdjęcie do wpisu"}
          loading="lazy"
          src={urlFor(value).width(800).format("webp").url()}
          style={{ width: "100%", height: "auto", borderRadius: "8px", margin: "1.5rem 0" }}
          onContextMenu={(e) => e.preventDefault()}
        />
      );
    },
  },
  marks: {
    link: ({ children, value }) => {
      const rel = !value.href.startsWith("/") ? "noreferrer noopener" : undefined;
      const target = !value.href.startsWith("/") ? "_blank" : undefined;
      return (
        <a href={value.href} rel={rel} target={target}>
          {children}
        </a>
      );
    },
  },
};

export default function PortableTextRenderer({ value }: Props) {
  if (!value) return null;
  return (
    <div className="portable-text">
      <PortableText value={value} components={components} />
    </div>
  );
}
