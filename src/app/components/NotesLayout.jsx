'use client';
// NotesLayout.js
// Same shell as Layout, but wraps children in a `prose` container so plain
// HTML tags (h1, p, ul, code, blockquote, table...) inherit consistent
// styling. It only styles typography — it doesn't constrain page structure,
// so any page using it is still free to drop in custom components, one-off
// sections, different links, etc.
import React from 'react';
import Layout from './template';

function NotesLayout({ children }) {
  return (
    <Layout>
      <article className='prose font-[WorkSans] flex-col space-y-[20%] flex prose-invert max-w-none'>{children}</article>
    </Layout>
  );
}

export default NotesLayout;
