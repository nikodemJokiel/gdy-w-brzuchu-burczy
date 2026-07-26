export const prerender = false;

import { sanityClient } from "../../lib/sanity";

export async function POST({ request }) {
  try {
    const body = await request.json();
    
    // Walidacja Honeypot (bot catch)
    if (body.website || body.fax) {
      // Udajemy, że przeszło pomyślnie, żeby zmylić bota
      return new Response(JSON.stringify({ success: true, message: "Komentarz wysłany." }), { status: 200 });
    }

    const { name, email, text, recipeId, parentId } = body;

    // Podstawowa walidacja
    if (!name || !text || !recipeId) {
      return new Response(JSON.stringify({ error: "Brak wymaganych pól." }), { status: 400 });
    }
    
    if (name.length > 50 || text.length > 1000) {
      return new Response(JSON.stringify({ error: "Przekroczono limit znaków." }), { status: 400 });
    }

    // Odczyt tokenu API z Vercel/Cloudflare env vars (NIGDY nie udostępnianego publicznie)
    const writeToken = import.meta.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
    
    if (!writeToken) {
      console.error("Brak SANITY_API_WRITE_TOKEN w zmiennych środowiskowych serwera!");
      return new Response(JSON.stringify({ error: "Błąd konfiguracji serwera." }), { status: 500 });
    }

    // Tworzenie klienta Sanity z tokenem zapisującym (tylko na serwerze!)
    const writeClient = sanityClient.withConfig({
      token: writeToken,
      useCdn: false // Writes always go to the direct API, not CDN
    });

    const doc: any = {
      _type: 'comment',
      name: name.trim(),
      email: email ? email.trim() : null,
      text: text.trim(),
      recipe: {
        _type: 'reference',
        _ref: recipeId
      },
      isApproved: true, // Automatyczna publikacja
      createdAt: new Date().toISOString()
    };
    
    if (parentId) {
      doc.parentComment = {
        _type: 'reference',
        _ref: parentId
      };
    }

    await writeClient.create(doc);

    return new Response(JSON.stringify({ success: true, message: "Komentarz dodany!" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Błąd podczas dodawania komentarza:", error);
    return new Response(JSON.stringify({ error: "Wewnętrzny błąd serwera." }), { status: 500 });
  }
}
