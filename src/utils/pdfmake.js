// src/utils/pdfmake.js
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts.js'

// 🔥 Attach the font virtual file system manually
pdfMake.vfs = pdfFonts.pdfMake.vfs

export default pdfMake
