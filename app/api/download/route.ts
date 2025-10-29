import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ success: false, error: 'No file path provided' })
    }

    // Security check - only allow files from uploads directory
    if (!filePath.startsWith('/uploads/')) {
      return NextResponse.json({ success: false, error: 'Invalid file path' })
    }

    const fullPath = join(process.cwd(), 'public', filePath)
    
    try {
      const fileBuffer = await readFile(fullPath)
      
      // Get file extension for proper MIME type
      const fileExtension = filePath.split('.').pop()?.toLowerCase()
      let mimeType = 'application/octet-stream'
      
      switch (fileExtension) {
        case 'pdf':
          mimeType = 'application/pdf'
          break
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg'
          break
        case 'png':
          mimeType = 'image/png'
          break
        case 'gif':
          mimeType = 'image/gif'
          break
        case 'doc':
          mimeType = 'application/msword'
          break
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          break
        case 'txt':
          mimeType = 'text/plain'
          break
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
        },
      })
    } catch (fileError) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

