export const getItem = (key) => {
  const value = localStorage.getItem(key);
  return value === null ? null : JSON.parse(value);
};

export const setItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};
