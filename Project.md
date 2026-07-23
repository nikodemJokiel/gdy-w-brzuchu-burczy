# SPECYFIKACJA PROJEKTU: Remake Bloga Kulinarnego (Instrukcja dla Agenta)

**Kontekst:**

Zadaniem jest zbudowanie nowej, wysoce zoptymalizowanej wersji bloga kulinarnego w oparciu o architekturę Headless i statyczne generowanie stron (SSG). Strona musi być szybka, przygotowana na nowoczesne algorytmy SEO/GEO (sztuczna inteligencja) i prosta w obsłudze dla nietechnicznego redaktora.
Link do bloga: https://gdywbrzuchuburczy.blogspot.com

## 1\. Stack Technologiczny

- **Frontend:** Astro z integracją React (wykorzystanie "Islands Architecture" dla zminimalizowania ilości JavaScriptu klienta), SCSS.
- **Backend/CMS:** Sanity CMS (Headless, w darmowym planie).
- **Hosting:** Vercel lub Cloudflare Pages (dla środowiska Astro i szybkiego CDN).
- **Wyszukiwanie:** Pagefind (statyczna wyszukiwarka WebAssembly).
- **Komentarze:** Zewnętrzny widget (np. Giscus lub Disqus) ładowany na stronach przepisów.

## 2\. Migracja Danych ze starego Bloggera (Blogspot)

- **Pobieranie wpisów:** Wykorzystaj natywny, publiczny kanał RSS Bloggera, odpytując adres z parametrami .../feeds/posts/default?alt=rss&max-results=500, co pozwoli na zescrapowanie archiwum postów bez logowania do panelu<sup>1</sup>.
- **Konwersja Treści:** Stwórz skrypt, który przetworzy pobrany ze starego bloga kod HTML na format _Portable Text_ (bloki oparte na JSON), który jest wymagany i natywnie obsługiwany przez Sanity CMS<sup>2</sup>.
- **Obsługa Zdjęć:** Skrypt migracyjny musi wyodrębnić linki do zdjęć ze starego kodu HTML, pobrać te pliki i wgrać je bezpośrednio na serwery zasobów Sanity, podmieniając odnośniki. Zapobiegnie to awariom, gdyby Blogspot przestał hostować obrazy<sup>3</sup>.
- **Komentarze:** Pobierz historyczne komentarze z publicznego kanału .../feeds/comments/default lub iterując po ID poszczególnych postów<sup>1</sup>. Wyeksportuj je w formacie akceptowanym przez wybrany nowy system zewnętrzny (Disqus/Giscus).

## 3\. Architektura CMS (Sanity)

- Zbuduj schematy dokumentów dla "Przepisu" obejmujące wielowymiarową kategoryzację (rodzaj posiłku, główny składnik, dieta, czas przygotowania).
- Stwórz osobny schemat dla sekcji "Portfolio/Współpraca B2B" (z polami na galerie kampanii i logotypy marek).
- Zmodyfikuj panel Sanity Studio, używając własnych komponentów React (np. do wygodnego dodawania składników lub wyświetlania statystyk pobieranych z API darmowych narzędzi typu Umami/Plausible).

## 4\. Wymagania Frontendowe i Interaktywność (React)

- **Zdjęcia:** Używaj formatów WebP/AVIF dostarczanych w locie przez zintegrowany z Sanity system Imgix. Wdróż fetchpriority="high" dla pierwszego, głównego zdjęcia przepisu. Dla pozostałych używaj loading="lazy" oraz LQIP (wygenerowane z base64 rozmyte placeholdery zmniejszające CLS).
- **Komponenty:** ryb "odznaczania" składników (checkboxy) oraz przycisk "Przejdź do przepisu" (Jump to recipe).
- **Wielojęzyczność (i18n):** Język polski domyślny w katalogu głównym (root). Wersja angielska dostępna w podkatalogu /en/. Każda wersja musi mieć precyzyjnie przetłumaczone odnośniki (slugi) w URL. tłumaczenia to niski priorytet - zaimplementujemy je dopiero po stworzeniu działającej strony po polsku.
- **Architektura nawigacji:** Zamiast infinite scroll, wdróż przycisk "zobacz więcej" ładujący kolejne posty oraz statyczną wyszukiwarkę, używając atrybutów data-pagefind-body ograniczających indeksowanie nawigacji.

## 5\. SEO, GEO (Generative Engine Optimization) i Prawo

- **Plik llms.txt:** Wygeneruj w katalogu głównym czysty plik Markdown podsumowujący kompetencje autora i listujący najlepsze przepisy (zoptymalizowane pod modele LLM).
- **Plik robots.txt:** Zezwól na dostęp agentom wyszukiwarek cytujących (OAI-SearchBot, PerplexityBot), ale zablokuj boty używające danych tylko do treningu (GPTBot).
- **Schema.org:** Zaimplementuj pełne ustrukturyzowane dane JSON-LD dla schematów Recipe (wymagane w Google Rich Snippets), FAQPage i Organization.
- **Prawa Autorskie:** W stopce umieść klauzulę o ochronie praw do oryginalnych tekstów i fotografii. Można wyłączyć możliwość robienia "kopiuj grafikę" z perspektywy strony

## 6\. Design i UI/UX

- Design minimalistyczny. Tryb ciemny i tryb jasny.
- Podział strony
  - Layout:
    - Header z nawigacją: width 100vw
    - Główna zawartość strony
    - Footer z informacjami typowymi dla stopki zoptymalizowanym pod seo, polityka prywatności, copyright, prawa do zdjęć z bloga, odnośniki itp.
  - Header: Position fixed, jest stale widoczny aby użytkownik miał dostęp do wyszukiwania i nawigacji. Na środku logo (napis "Gdy w brzuchu burczy" wraz z jakąś ikoną - załączę ci je później, na razie możesz użyć placeholderu) jako odnośnik do strony głównej. Od prawej strony - logo facebooka i instagrama - odnośniki do mediów społecznościowych, ikonka zmiany trybów jasny/ciemny, ikona zmiany języków (dopiero po zaimplementowaniu dwujęzyczności), przyciski odnoszące do podstron: "współpraca", "o mnie". Od lewej: 2 możliwości: 1. napis przepisy odnoszący do strony z postami (taka sama jak strona główna ale bez początkowej karuzeli). Po najechaniu wysuwa się menu wyboru po konkretnych tagach/kryteriach (tak jak późniejsze filtry) ale kliknięcie danej kategorii odsyła na stronę z samymi przepisami przefiltrowanymi po konkrentej kategorii. 2. Menu typu hamburger, dopiero po jego kliknięciu wysuwa się menu w którym poza kategoriami można też kliknąć "zobacz wszystko:. (potencjalnie czystsze i bardziej minimalistyczne. Możesz zdecydować które rozwiązanie będzie lepsze. Potem wyszukiwarka szukająca po tagach, a jeżeli nie znajdzie tagów to po słowach kluczowych z pełnej zawartości postów. Wyszukiwarka odsyła na stronę z samymi postami (posortowanymi według 1. Wyszukiwanie z tagu, 2. Wyszukiwanie z treści posta 3. Od najnowszego. Ograniczenie wyświetlania do 9 lub 12 i potem "załaduj więcej" jeśli skończą się wyfiltrowane lub wyszukiwane posty to można dodać resztę postów (po odpowiednim komunikacie typu "zobacz też" ) w kolejności od najnowszego. Jeśli wyszukiwanie nie znajdzie niczego to ładny komunikat na ten temat a potem wszystkie posty. Wysoki priorytet
  - Główna zawartość strony:
    - Strona główna:
      - Karuzela eksponująca kilka wybranych przepisów (4 lub 5) poprzez duże zdjęcia (ewentualnie też tytuł przepisu z opisem lub częścią opisu). Layout to albo jedno szerokie zdjęcie które można przewijać albo trzy kwadratowe zdjęcia z czego środkowe jest tym łównym a boczne częściowo wychodzą poza ekran co zachęca do ich przesunięcia. W trybie jasnym będą to zdjęcia potraw na jasnych tłach a w trybie ciemnym podmienimy przepisy te te ze zdjęciami na ciemnych tłach - będzie potrzebna przyjemna animacja do tych zmian. Po kliknięciu w dane zdjęcie jesteśmy odsyłani na stronę konkretnego przepisu. Priorytet niski - możemy wdrożyć ten komponent dopiero po zrobieniu głównych funkcjonalności bloga.
      - Lista postów (zdjęć z przepisami). Domyślnie w 3 kolumnach od najnowszego (na górze). Po zwężeniu ekranu responsywnie zmienia się na 2 kolumny a potem na 1 kolumnę. Większość oryginalnych zdjęć okładkowych (pierwsze zdjęcie) z bloga będzie w formacie kwadratu 1:1 i tak je pozostawiamy. Pod zdjęciem przyległe do prawej granicy zdjęcia powinna być data w formacie 01/01/26 a po lewej stronie tytuł posta (jeżeli będzie za długi to może być w kilku linijkach tak aby nie nachodził na datę (jeżeli powyższy layout nie będzie pasował to go zmienimy). Poniżej trochę lżejszą grubością czcionki treść wpisu blogowego ograniczona do konkretnej długości aby posty były spójne i ładnie wyglądały. Po kliknięciu w obszar posta jesteśmy odsyłani na stronę konkretnego posta/przepisu. W wersji mobilnej będzie to jedna kolumna (typowy layout scrollowania). Uwaga - w wersji mobilnej chciałbym aby przesunięcie w lewo powodowało pokazanie kolejnego zdjęcia danego posta (tak jak w karuzelach na instagramie). Możesz dodać małe szare kropeczki na dole informujące o ilości zdjęć w karuzeli. Domyślnie wczytuje się 9 lub 12 postów a po zjechaniu na dół pojawia się przycisk "zobacz więcej" który ładuje kolejne posty. W górnej części sekcji wszystkich postów po prawej stronie zastosuj przycisk filtrowania. Po jego kliknięciu wysuwa się z niego okno filtrów. Zaproponuj je na podstawie tagów postów znalezionych w spisie wszystkich postów bloga oraz na podstawie innych dobrych blogów kulinarnych. Ważne jest aby można było zaznaczyć kilka filtrów na raz i w ten sposób zawęzić wyszukiwanie. Jeżeli z perspektywy wyszukiwarki wyszukamy dokładnie taką kategorię jaka jest w filtrach to może się ona również zaznaczyć. Jeśli filtry są aktywne to nad przyciskiem filtrowania może pojawić się mały numerek z ilością zastosowanych filtrów. Generalnie będzie to coś takiego jak szukanie po kategorii z nawigacji ale będzie można wybrać kilka kategorii zamiast jednej która przesyła nas na konkretny zbiór postów. Przycisk filtrów wraz ze scrollowaniem w dół zniknie z obszaru wyświetlania ale kiedy użytkownik będzie go chciał znowu użyć to nie musi scrollować a samą górę bo przy scrollu w górę naturalnie się wyłoni dając dostęp do filtrów w każdym momencie. Wysoki priorytet
    - Strona konkretnego posta. Przenosimy się tam po kliknięciu w konkretny post. W kolumnie po lewej stronie lista składników. Jeżeli jest za długa to scrolluje się ona osobno (jeżeli najedziemy na nią myszką) lub wraz z całą stroną ale dopiero od momentu kiedy zescrollujemy cały post do sekcji o sposobie przygotowania. Poszczególne składniki to lista z checkboxami zamiast indykatorów, jeżeli klikniemy w dany składnik to to checkbox się zaznacza a składnik zostaje przekreślony (może też się zrobić bardziej szary). Jeżeli klikniemy jeszcze raz to wraca do poprzedniej postaci. Po prawej stronie klasyczny przepis - podobnie jak na oryginalnym blogu - na samej górze tytuł, mała data, potem zdjęcie główne, opis posta potem kolejne zdjęcia przeplatające się z treścią - layout kolumny. Ważne jest to aby na samej górze dodać przycisk typu "idź do przepisu" który automatycznie przy scrolluje za nas do momentu zaczynania się opisu przyrządzania dania (rozwiązanie dla niecierpliwych, którzy nie chcą czytać całego posta). Trzeba go wkomponować gdzieś na początku (np. Zaraz pod pierwszym zdjęciem lub gdzieś po prawej stronie - wybierz najlepsze miejsce, możesz inspirować się innymi blogami). Jeżeli jesteś w stanie rozbić akapity kroków przyrządzania to też możemy zastosować mechanizm kliknięcia aby zaznaczać już wykonane kroki. Tagi danego posta mogą być też wyswietlone i być odnośnikiem do konkretnego wyszukiwania/filtrowania. Na samym dole komentarze (jeżeli uda się je przywrócić z oryginalnego bloga). W wersji mobilnej trzeba będzie zastosować layout jednej kolumny gdzie składniki wrócą na swoje miejsce i nie będą po lewej stronie. Z tego powodu szybka nawigacja po danym poście będzie kluczowa. Myślę że albo powinniśmy dodać przyciski "idź do przepisu" oraz "idź do składników" przy tych sekcjach aby w czasie przyrządzania użytkownik mógł się pomiędzy nimi szybko przełączać albo zrobić mały "spis treści" za pomocą ikonek (np. Na dole) jak "drugą nawigację". Ikonki reprezentowały by 1. Treść posta (czyli po prostu sam początek), 2. Składniki 3. przepis 4. Komentarze (ewentualnie też coś pomiędzy jeżeli jest w poście (typu wartości odżywcze)). Taki spis treści można też zrobić w wersji webowej (u góry, na prawym lub lewym marginesie strony). Podczas scrollowania podświetla się akurat aktywny element. Wysoki priorytet
    - Strona "o mnie": musi być miejsce na opis (jeszcze go nie mam więc wstaw placeholder) oraz na zdjęcie osoby odpowiedzialnej za blog - też możesz dać placeholder. Na końcu opisu może być call to action typu "zapraszam do współpracy" które będzi eprzenosić na stronę współpraca. Priorytet niski (najpierw chciałbym zaimplementować funkcjonalność postów i przepisów)
    - Strona współpraca: Ładna galeria wybranych przepisów oraz przepisów które są oznaczone jako sponsorowane jako "portfolio prac" (zdjęcia oczywiście odnoszą do przepisów). Opis na czym może polegać współpraca - też na razie nie mam opisu więc możesz dać placeholder. Może być jakieś call to action typu bezpłatna konsultacja/ podane dane kontaktowe (email). Na dole dodamy też loga marek które już skorzystały ze współpracy. Priorytet niski (najpierw chciałbym zaimplementować funkcjonalność postów i przepisów)
  - Stopka: zoptymalizowana pod SEO, może też mieć dane kontaktowe. Wysoki priorytet
- Design
  - Dla zawartości głównej strony zostawiamy marginesy prawy i lewy puste dla lepszej percepcji i odpoczynku oczu
  - Tryb jasny ma białe tło. Kolor tekstu jest czarny lub ciemno zielony (jeszcze nie jestem pewien co do palety kolorów). Tryb ciemny to tło koloru bardzo ciemno szarego (ale nie całkiem czarnego), Biała czcionka, Też mogą być zielone akcenty.
  - Czcionka - możemy zacząć od minimalistycznej, bezszeryfowej. Jeżeli w jakimś miejscu pasowała by ci szeryfowa lub bardziej ozdobna to daj znać, najwyżej będziemy to zmieniać.
- Obsługa z perspektywy panelu dla osoby nietechnicznej:
  - Pokazywanie danych ruchu na stronie internetowej w panelu (niski priorytet)
  - Funkcje edytowania strony:
    - Tworzenie, edycja, usuwanie strony. Dla Strony posta możliwość dodawania komponentów: tytuł, data (będzie dodawać się automatycznie ale można ją edytować), zdjęcie (przydałby się w miarę intuicyjny interfejs aby określić wymiar zdjęcia), treść posta, lista składników, przycisk ("idź do przepisu"), przepis, tagi, odnośnik do social mediów, wartości odżywcze, customowy komponent (można wybrać nazwę). Komponenty te można dowolnie dodawać, zreorganizować ich kolejność tak aby można było przeplatać treść posta z dodanymi zdjęciami. Po utworzeniu takiego posta automatycznie tworzy się "nawigacja" po poście (tak jak została opisana w designie konkretnego posta). Sekcja komentarzy jest automatycznie na samym dole. Komponenty można usuwać, dodawać, edytować. (wysoki priorytet)
    - Edycja górnej karuzeli na stronie głównej - dodanie tam zdjęcia i opisu zarówno dla motywu jasnego jak i ciemnego (mogą być inne w zależności od motywu) (średni priorytet)
    - Edycja strony współpracę i dodawanie do tamtejszej galerii konkretnych zdjęć przepisów (niski priorytet)
    - Pozostałe elementy nie będą często zmieniane i nie wymagają łatwej edycji przez panel chociaż jeżeli można to prosto zrobić to będzie to miłe usprawnienie
- Inne:
  - Obsługa komunikatu o ciasteczkach w ładny nie natarczywy i prosty do zaakceptowania sposób
  - Pełna optymalizacja SEO (nie wiem czy lepiej robić ja na bieżąco czy dopiero po skończeniu strony?)
  - Pełna responsywność w trybie mobilnym. Zaproponuj ładny topbar i nawigację zwiniętą do "hamburgera"
  - Zastosuj normy programistyczne przy pisaniu storny, pisz kod po angielsku (jedynie treść ma być domyślnie po polsku), możesz zainstalować jakieś lintery/precommity

#### Works cited

- Blogger RSS Feed: URL Format, Examples & Import Notes | Aggregator, <https://finder.wprssaggregator.com/rss-feeds/platform/blogger>
- Gatsby and its Greatness - Habr, <https://habr.com/en/articles/804783/>
- Moving my blog from Blogger to Jekyll, <https://www.sevarg.net/2021/07/04/moving-from-blogger-to-jekyll/>
- Migrate from WordPress to Headless CMS: Complete Guide for Publishers - Publive, <https://www.thepublive.com/feeds/blog/migrate-wordpress-headless-cms>
- How to get Blogger post comments for URL using API or anything else? - Stack Overflow, <https://stackoverflow.com/questions/3392545/how-to-get-blogger-post-comments-for-url-using-api-or-anything-else>