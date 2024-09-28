export const stripHtml = (html?: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html? html : '';
  return div.textContent || div.innerText || '';
}
