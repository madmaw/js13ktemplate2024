import { hello } from 'folder/lib';

export function hello2(name: string | number) {
  hello(`${name} 2`);
}
