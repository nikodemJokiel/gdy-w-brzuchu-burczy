import {
  Beef,
  Fish,
  Soup,
  Wheat,
  Salad,
  Pizza,
  Leaf,
  CakeSlice,
  Cookie,
  IceCream,
  GlassWater,
  PartyPopper,
  Gift,
  Flame,
  Ghost,
  Heart,
  Donut,
  Rabbit
} from 'lucide-react';

export type TagCategory = {
  id: string;
  label: string;
  icon: any; // Lucide icon
  tags: string[];
  hideSubTags?: boolean;
};

export type MainSection = {
  id: string;
  label: string;
  categories: TagCategory[];
};

export const TAXONOMY: MainSection[] = [
  {
    id: "salty",
    label: "Na słono",
    categories: [
      {
        id: "light",
        label: "Lekko i Szybko",
        icon: Salad,
        tags: ["sałatki", "do chleba", "sosy i dipy", "grzyby", "przetwory"]
      },
      {
        id: "meatless",
        label: "Bezmięsne",
        icon: Leaf,
        tags: ["dania bezmięsne", "bez mięsa", "kuchnia wegetariańska"],
        hideSubTags: true
      },
      {
        id: "fish",
        label: "Z wody",
        icon: Fish,
        tags: ["dania rybne", "owoce mórz i jezior", "ryby"],
        hideSubTags: true
      },
      {
        id: "meat",
        label: "Mięsa",
        icon: Beef,
        tags: ["drób", "wieprzowina", "wołowina", "domowe wędliny"]
      },
      {
        id: "soup",
        label: "Ciepłe miski",
        icon: Soup,
        tags: ["zupy", "dania jednogarnkowe"]
      },
      {
        id: "grains",
        label: "Kasze i Makarony",
        icon: Wheat,
        tags: ["makarony", "kasze i ryże", "pierogi"]
      },
      {
        id: "baking",
        label: "Wypieki Wytrawne",
        icon: Pizza,
        tags: ["chleby i bułki", "pizza", "placki i naleśniki wytrawne"]
      }
    ]
  },
  {
    id: "sweet",
    label: "Na słodko",
    categories: [
      {
        id: "cakes",
        label: "Ciasta",
        icon: CakeSlice,
        tags: [
          "babki i ciasta ucierane", "ciasta drożdżowe", "ciasta na biszkopcie",
          "kruche ciasta", "serniki", "torty", "brownies", "ciasta czekoladowe",
          "przekładańce", "ciasta z jabłkami", "ciasta z owocami", "ciasta z warzywami"
        ]
      },
      {
        id: "cookies",
        label: "Drobne Wypieki",
        icon: Cookie,
        tags: ["ciastka", "ciasteczka", "muffiny i babeczki", "pierniki i pierniczki"]
      },
      {
        id: "desserts",
        label: "Desery",
        icon: IceCream,
        tags: ["desery", "gofry", "racuchy i naleśniki"]
      },
      {
        id: "drinks",
        label: "Napoje",
        icon: GlassWater,
        tags: ["napoje / koktajle / smoothies", "napoje"],
        hideSubTags: true
      }
    ]
  },
  {
    id: "occasions",
    label: "Okazje",
    categories: [
      {
        id: "christmas",
        label: "Boże Narodzenie",
        icon: Gift,
        tags: ["boże narodzenie", "święta bożego narodzenia", "wigilia"],
        hideSubTags: true
      },
      {
        id: "easter",
        label: "Wielkanoc",
        icon: Rabbit,
        tags: ["wielkanoc"],
        hideSubTags: true
      },
      {
        id: "sylwester",
        label: "Sylwester / Impreza",
        icon: PartyPopper,
        tags: ["sylwester", "impreza"],
        hideSubTags: true
      },
      {
        id: "grill",
        label: "Grill",
        icon: Flame,
        tags: ["grill"],
        hideSubTags: true
      },
      {
        id: "halloween",
        label: "Halloween",
        icon: Ghost,
        tags: ["halloween"],
        hideSubTags: true
      },
      {
        id: "valentines",
        label: "Walentynki",
        icon: Heart,
        tags: ["walentynki"],
        hideSubTags: true
      },
      {
        id: "fat-thursday",
        label: "Tłusty czwartek",
        icon: Donut,
        tags: ["tłusty czwartek"],
        hideSubTags: true
      }
    ]
  }
];

export function getAllTagsForCategory(categoryId: string): string[] {
  for (const section of TAXONOMY) {
    const cat = section.categories.find(c => c.id === categoryId);
    if (cat) return cat.tags;
  }
  return [];
}

export function getAllTagsForSection(sectionId: string): string[] {
  const section = TAXONOMY.find(s => s.id === sectionId);
  if (!section) return [];
  return section.categories.flatMap(c => c.tags);
}
