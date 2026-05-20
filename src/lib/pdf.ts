import PDFDocument from 'pdfkit'

export async function generateDischargePdf(patient: any, discharge: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      const chunks: any[] = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', err => reject(err))

      // Fetch fonts for Cyrillic support
      const regularFontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf'
      const boldFontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf'

      const [regFontBuffer, boldFontBuffer] = await Promise.all([
        fetch(regularFontUrl).then(res => res.arrayBuffer()),
        fetch(boldFontUrl).then(res => res.arrayBuffer())
      ])

      doc.registerFont('Roboto-Regular', Buffer.from(regFontBuffer))
      doc.registerFont('Roboto-Bold', Buffer.from(boldFontBuffer))

      // Grid/Positioning constants
      const startX = 40
      let currentY = 40
      const width = 515 // A4 width is 595, minus 80 margin

      // 1. Official stamps header
      doc.font('Roboto-Bold').fontSize(10).fillColor('#0f172a')
      doc.text('МЕДИЦИНСКАЯ КЛИНИКА «PlanetaMed»', startX, currentY)
      
      doc.font('Roboto-Regular').fontSize(8).fillColor('#475569')
      currentY += 13
      doc.text('Лицензия № ЛО-77-01-012345 от 12.04.2024', startX, currentY)
      currentY += 11
      doc.text('Адрес: г. Москва, ул. Клиническая, д. 15 | Тел: +7 (495) 123-45-67', startX, currentY)

      // Metadata stamp on the right
      doc.font('Roboto-Regular').fontSize(8).fillColor('#475569')
      doc.text('Медицинская документация', 380, 40, { align: 'right', width: 175 })
      doc.font('Roboto-Bold').fontSize(9).fillColor('#0f172a')
      doc.text('Форма № 027/у', 380, 53, { align: 'right', width: 175 })
      doc.font('Roboto-Regular').fontSize(8).fillColor('#475569')
      doc.text('Утверждена Минздравом РФ', 380, 64, { align: 'right', width: 175 })

      currentY = 85
      
      // Divider
      doc.moveTo(startX, currentY).lineTo(startX + width, currentY).lineWidth(1).strokeColor('#cbd5e1').stroke()
      doc.moveTo(startX, currentY + 3).lineTo(startX + width, currentY + 3).lineWidth(1).strokeColor('#cbd5e1').stroke()

      // Title Block
      currentY += 18
      doc.font('Roboto-Bold').fontSize(16).fillColor('#0f172a')
      doc.text('ВЫПИСНОЙ ЭПИКРИЗ', startX, currentY, { align: 'center', width })
      currentY += 18
      doc.font('Roboto-Regular').fontSize(9).fillColor('#475569')
      doc.text('из медицинской карты амбулаторного (стационарного) больного', startX, currentY, { align: 'center', width })
      
      // Formatted dates
      const formatRuDate = (dateStr: string) => {
        if (!dateStr) return ''
        try {
          const d = new Date(dateStr)
          return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
        } catch {
          return dateStr
        }
      }

      currentY += 13
      doc.font('Roboto-Regular').fontSize(8).fillColor('#475569')
      doc.text(`Дата оформления: ${formatRuDate(discharge.updatedAt)}`, startX, currentY, { align: 'center', width })

      // Helper for sections
      const drawSectionTitle = (title: string) => {
        currentY += 22
        doc.font('Roboto-Bold').fontSize(10).fillColor('#2563eb')
        doc.text(title, startX, currentY)
        currentY += 12
        doc.moveTo(startX, currentY).lineTo(startX + width, currentY).lineWidth(0.5).strokeColor('#cbd5e1').stroke()
        currentY += 6
      }

      // 2. Patient details
      drawSectionTitle('1. СВЕДЕНИЯ О ПАЦИЕНТЕ')
      
      const dobFormatted = patient.dateOfBirth ? formatRuDate(patient.dateOfBirth) : 'Не указана'
      const periodOfTreatment = `с ${formatRuDate(discharge.startDate)} по ${formatRuDate(discharge.endDate)}`

      const drawRow = (label: string, value: string, isBold = false) => {
        doc.font('Roboto-Regular').fontSize(9).fillColor('#475569')
        doc.text(label, startX, currentY)
        doc.font(isBold ? 'Roboto-Bold' : 'Roboto-Regular').fontSize(9).fillColor(isBold ? '#0f172a' : '#334155')
        doc.text(value, startX + 160, currentY, { width: width - 160 })
        
        const textHeight = doc.heightOfString(value, { width: width - 160 })
        currentY += Math.max(14, textHeight) + 4
        
        doc.moveTo(startX, currentY).lineTo(startX + width, currentY).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#f1f5f9').stroke()
        doc.undash()
        currentY += 4
      }

      drawRow('Ф.И.О. пациента:', `${patient.lastName || ''} ${patient.firstName || ''}`, true)
      drawRow('Дата рождения:', dobFormatted)
      drawRow('Контактный телефон:', patient.phone || '')
      if (patient.email) {
        drawRow('Электронная почта:', patient.email)
      }
      drawRow('Период лечения / наблюдения:', periodOfTreatment, true)

      // Helper for drawing text boxes
      const drawContentBox = (text: string, bgColor: string, borderColor: string, textColor: string) => {
        const padding = 10
        doc.font('Roboto-Regular').fontSize(9)
        const textWidth = width - 12 - (padding * 2)
        const textHeight = doc.heightOfString(text, { width: textWidth, lineGap: 2 })
        const boxHeight = textHeight + (padding * 2)

        // Check page overflow
        if (currentY + boxHeight > 780) {
          doc.addPage()
          currentY = 40
        }

        // Draw light background
        doc.rect(startX + 4, currentY, width - 4, boxHeight).fill(bgColor)
        // Draw solid accent left border
        doc.rect(startX, currentY, 4, boxHeight).fill(borderColor)

        // Draw text
        doc.font('Roboto-Regular').fontSize(9).fillColor(textColor)
        doc.text(text, startX + 4 + padding, currentY + padding, { width: textWidth, lineGap: 2 })

        currentY += boxHeight
      }

      // 3. Clinical Diagnosis
      drawSectionTitle('2. КЛИНИЧЕСКИЙ ДИАГНОЗ')
      drawContentBox(discharge.diagnosis || '', '#fffbeb', '#f59e0b', '#92400e')

      // 4. Complaints
      if (discharge.complaints) {
        drawSectionTitle('3. ЖАЛОБЫ И АНАМНЕЗ ЗАБОЛЕВАНИЯ')
        drawContentBox(discharge.complaints, '#f8fafc', '#cbd5e1', '#334155')
      }

      // 5. Tests
      if (discharge.tests) {
        drawSectionTitle('4. ДАННЫЕ ОБСЛЕДОВАНИЙ И ЛАБОРАТОРНЫХ ИССЛЕДОВАНИЙ')
        drawContentBox(discharge.tests, '#f8fafc', '#cbd5e1', '#334155')
      }

      // 6. Treatment
      if (discharge.treatment) {
        drawSectionTitle('5. ПРОВЕДЕННОЕ LEЧЕНИЕ В КЛИНИКЕ')
        drawContentBox(discharge.treatment, '#f8fafc', '#cbd5e1', '#334155')
      }

      // 7. Recommendations
      drawSectionTitle('6. НАЗНАЧЕНИЯ И МЕДИЦИНСКИЕ РЕКОМЕНДАЦИИ')
      drawContentBox(discharge.recommendations || '', '#f0fdf4', '#10b981', '#065f46')

      // 8. Signatures & Stamp
      currentY += 25
      if (currentY + 90 > 780) {
        doc.addPage()
        currentY = 40
      }

      const sigTop = currentY
      doc.font('Roboto-Bold').fontSize(9).fillColor('#475569')
      doc.text('Лечащий врач:', startX, sigTop)
      doc.font('Roboto-Bold').fontSize(10).fillColor('#0f172a')
      doc.text(discharge.attendingDoctorName || '', startX, sigTop + 14)

      // Signature line and stamp space
      doc.font('Roboto-Regular').fontSize(9).fillColor('#475569')
      doc.text('Подпись врача _________________', 320, sigTop)
      
      // Seal circle
      doc.circle(460, sigTop + 45, 30).lineWidth(1).dash(3, { space: 3 }).strokeColor('#cbd5e1').stroke()
      doc.font('Roboto-Regular').fontSize(9).fillColor('#475569')
      doc.text('М.П.', 450, sigTop + 40)

      // Footer
      currentY = 740
      doc.moveTo(startX, currentY).lineTo(startX + width, currentY).lineWidth(0.5).strokeColor('#cbd5e1').stroke()
      currentY += 10
      doc.font('Roboto-Regular').fontSize(7.5).fillColor('#94a3b8')
      doc.text('Данная выписка является официальным медицинским документом клиники «PlanetaMed».', startX, currentY, { align: 'center', width })
      currentY += 10
      doc.text('Документ сформирован в электронной медицинской системе клиники.', startX, currentY, { align: 'center', width })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
