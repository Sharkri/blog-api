import { adjectives, nouns } from "./word-sets";

const capitalize = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

const getRandomItem = (items: string[]) =>
  items[Math.floor(Math.random() * items.length)];

export default function generateUsername() {
  const noun = capitalize(getRandomItem(nouns));
  const adjective = capitalize(getRandomItem(adjectives));
  return `${noun} ${adjective}`;
}
