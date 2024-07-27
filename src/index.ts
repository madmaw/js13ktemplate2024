import { hello } from 'folder/lib';
import { hello2 } from 'folder2/lib2';

const a = 'there'.split('').join('');
let count = 0;
hello(a);

onload = function () {
  document.onclick = function () {
    hello2(count++);
  };
};
