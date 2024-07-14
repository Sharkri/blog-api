import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";

export default function generateUsername() {
  const randomName = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: " ",
    length: 3,
    style: "capital",
  }); // Hasty Beige Fox

  return randomName;
}
