import { useState, useMemo } from 'react';
import './SanityComments.scss';

export default function SanityComments({ comments = [], recipeId }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [website, setWebsite] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'error'
  const [message, setMessage] = useState('');

  // NOWY STAN: Flaga sprawdzająca czy główny formularz został pomyślnie wysłany
  const [hasMainCommented, setHasMainCommented] = useState(false);

  const [localComments, setLocalComments] = useState(comments);

  // Group comments into a tree
  const commentTree = useMemo(() => {
    const map = new Map();
    const roots = [];

    // First pass: map them all
    localComments.forEach(c => {
      map.set(c._id, { ...c, children: [] });
    });

    // Second pass: attach children to parents
    localComments.forEach(c => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId).children.push(map.get(c._id));
      } else {
        roots.push(map.get(c._id));
      }
    });

    return roots;
  }, [localComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    // Zapisujemy aktualne replyingTo przed wysłaniem, bo zaraz zresetujemy stany
    const currentReplyingTo = replyingTo;

    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, text, recipeId, website, parentId: currentReplyingTo })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Twój komentarz został opublikowany!');

        setLocalComments(prev => [...prev, {
          _id: Date.now().toString(),
          name,
          text,
          parentId: currentReplyingTo,
          createdAt: new Date().toISOString()
        }]);

        // Czyszczenie pól (możesz usunąć czyszczenie name i email, jeśli chcesz
        // aby przy kolejnych odpowiedziach użytkownik nie musiał ich wpisywać na nowo)
        setName('');
        setEmail('');
        setText('');
        setStatus('idle');

        if (!currentReplyingTo) {
          // Jeśli to był główny komentarz - blokujemy formularz na stałe
          setHasMainCommented(true);
        } else {
          // Jeśli to była odpowiedź - po prostu zamykamy okienko odpowiedzi.
          // Użytkownik i tak od razu zobaczy swój komentarz na liście, więc wie, że się udało.
          setReplyingTo(null);
        }

      } else {
        setStatus('error');
        setMessage(data.error || 'Wystąpił błąd. Spróbuj ponownie.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Błąd połączenia. Spróbuj ponownie.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderCommentNode = (node) => (
    <li key={node._id} className="sanity-comments__item-container">
      <div className="sanity-comments__item">
        <div className="sanity-comments__header">
          <strong>{node.name === 'Anonymous' ? 'Anonimowy' : node.name}</strong>
          <time>{formatDate(node.createdAt)}</time>
        </div>
        <div className="sanity-comments__body" dangerouslySetInnerHTML={{ __html: node.text.replace(/\n/g, '<br />') }}></div>
        <button
          className="sanity-comments__reply-btn"
          onClick={() => setReplyingTo(replyingTo === node._id ? null : node._id)}
        >
          {replyingTo === node._id ? 'Anuluj' : 'Odpowiedz'}
        </button>

        {replyingTo === node._id && (
          <div className="sanity-comments__inline-form">
            {renderCommentForm(node._id)}
          </div>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <ul className="sanity-comments__replies">
          {node.children.map(child => renderCommentNode(child))}
        </ul>
      )}
    </li>
  );

  const renderCommentForm = (parentId = null) => {
    const isMainForm = parentId === null;

    // Jeśli to główny formularz i użytkownik już dodał komentarz - renderuj TYLKO wiadomość o sukcesie
    if (isMainForm && hasMainCommented) {
      return (
        <div className="sanity-comments__form-wrapper">
          <h4>Dodaj komentarz</h4>
          <div className="sanity-comments__success">
            {message || 'Twój komentarz został opublikowany! Przeładuj stronę, aby dodać kolejny.'}
          </div>
        </div>
      );
    }

    // Standardowe renderowanie formularza (dla odpowiedzi lub przed napisaniem głównego komentarza)
    return (
      <div className="sanity-comments__form-wrapper">
        <h4>{parentId ? 'Napisz odpowiedź' : 'Dodaj komentarz'}</h4>

        <form className="sanity-comments__form" onSubmit={handleSubmit}>
          <div className="sanity-comments__input-group">
            <label htmlFor={`name-${parentId || 'main'}`}>Imię (podpis) *</label>
            <input type="text" id={`name-${parentId || 'main'}`} required maxLength={50} value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="sanity-comments__input-group">
            <label htmlFor={`email-${parentId || 'main'}`}>E-mail *</label>
            <input type="email" id={`email-${parentId || 'main'}`} required maxLength={100} value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="sanity-comments__honeypot" aria-hidden="true" style={{ opacity: 0, position: 'absolute', top: 0, left: -9999 }}>
            <label htmlFor={`website-${parentId || 'main'}`}>Strona internetowa</label>
            <input type="text" id={`website-${parentId || 'main'}`} tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
          </div>

          <div className="sanity-comments__input-group">
            <label htmlFor={`text-${parentId || 'main'}`}>Komentarz *</label>
            <textarea id={`text-${parentId || 'main'}`} required rows={2} maxLength={1000} value={text} onChange={e => setText(e.target.value)}></textarea>
          </div>

          {status === 'error' && replyingTo === parentId && <div className="sanity-comments__error">{message}</div>}

          <button type="submit" disabled={status === 'loading'} className="sanity-comments__submit">
            {status === 'loading' ? 'Wysyłanie...' : 'Opublikuj komentarz'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="sanity-comments">
      <h3 className="sanity-comments__title">
        Komentarze ({localComments.length})
      </h3>

      {!replyingTo && renderCommentForm()}

      {commentTree.length > 0 ? (
        <ul className="sanity-comments__list">
          {commentTree.map((node) => renderCommentNode(node))}
        </ul>
      ) : (
        <p className="sanity-comments__empty">Bądź pierwszą osobą, która skomentuje ten przepis!</p>
      )}
    </div>
  );
}