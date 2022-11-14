export {};

const a = "".padStart(32);
const t = new TextEncoder().encode("bar");
const w = new ServiceWorker();
// @tsbc-ignore
w.postMessage();
fetch();
foobar();
alert("test");
open("foo");

new AbortController().abort();
new window.AbortController().abort();
console.log(navigator.doNotTrack);

class AbortController {
  abort() {}
}
