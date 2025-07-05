const fs = require('fs');
const path = require('path');

async function inspectArchive() {
    try {
        const archivePath = 'attached_assets/остальные_1751719915437.rar';
        
        // Читаем первые байты файла для определения типа
        const buffer = fs.readFileSync(archivePath);
        const header = buffer.slice(0, 16);
        
        console.log('Заголовок файла (hex):', header.toString('hex'));
        console.log('Заголовок файла (ascii):', header.toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
        console.log('Размер файла:', buffer.length, 'байт');
        
        // Проверяем, что это действительно RAR
        const rarSignature = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]); // Rar!...
        const rarSignature5 = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00]); // RAR 5.0
        
        if (buffer.slice(0, 7).equals(rarSignature) || buffer.slice(0, 8).equals(rarSignature5)) {
            console.log('✓ Подтверждено: это RAR архив');
            
            // Попробуем найти имена файлов в архиве (простой анализ)
            const content = buffer.toString('latin1');
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
            const foundFiles = [];
            
            for (const ext of imageExtensions) {
                let index = 0;
                while ((index = content.indexOf(ext, index)) !== -1) {
                    // Ищем начало имени файла (идем назад до пробела/нуля)
                    let start = index;
                    while (start > 0 && content.charCodeAt(start - 1) > 32 && content.charCodeAt(start - 1) < 127) {
                        start--;
                    }
                    
                    const filename = content.substring(start, index + ext.length);
                    if (filename.length > ext.length && filename.length < 100) {
                        foundFiles.push(filename);
                    }
                    index++;
                }
            }
            
            if (foundFiles.length > 0) {
                console.log('\n📁 Найденные файлы изображений в архиве:');
                [...new Set(foundFiles)].forEach((file, i) => {
                    console.log(`  ${i + 1}. ${file}`);
                });
            }
            
        } else {
            console.log('✗ Это не стандартный RAR архив');
        }
        
    } catch (error) {
        console.error('Ошибка при анализе архива:', error.message);
    }
}

inspectArchive();