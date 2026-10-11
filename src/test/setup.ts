import "@testing-library/jest-dom";

// jsdom does not implement the Blob URL API; define stubs so tests can spy on them.
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:jsdom-stub";
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = () => undefined;
}
