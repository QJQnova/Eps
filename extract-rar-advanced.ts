import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function extractRAR() {
    const archivePath = 'attached_assets/остальные_1751719915437.rar';
    const extractPath = 'attached_assets/extracted_images/';
    
    // Создаем папку для извлеченных изображений
    if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
    }

    console.log('🔍 Попытка извлечения RAR архива...');

    // Список команд для попытки извлечения
    const commands = [
        `unrar x "${archivePath}" "${extractPath}"`,
        `rar x "${archivePath}" "${extractPath}"`,
        `7z x "${archivePath}" -o"${extractPath}"`,
        `7za x "${archivePath}" -o"${extractPath}"`,
        `p7zip -d "${archivePath}"`,
    ];

    for (const command of commands) {
        try {
            console.log(`⚙️ Попытка: ${command.split(' ')[0]}`);
            const { stdout, stderr } = await execAsync(command);
            
            if (stdout.includes('OK') || stdout.includes('Everything is Ok') || 
                fs.readdirSync(extractPath).length > 0) {
                console.log('✅ Архив успешно извлечен!');
                return true;
            }
        } catch (error: any) {
            console.log(`❌ ${command.split(' ')[0]} недоступен или не сработал`);
        }
    }

    console.log('⚠️ Стандартные утилиты не сработали. Попытка альтернативного метода...');

    // Альтернативный метод - попытка с помощью Python
    try {
        const pythonScript = `
import subprocess
import sys
import os

try:
    # Установим rarfile если его нет
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'rarfile'])
    
    import rarfile
    
    # Открываем и извлекаем архив
    with rarfile.RarFile('${archivePath}') as rf:
        rf.extractall('${extractPath}')
    
    print("SUCCESS: RAR extracted with Python")
    
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
`;

        fs.writeFileSync('temp_extract.py', pythonScript);
        const { stdout } = await execAsync('python3 temp_extract.py');
        
        if (stdout.includes('SUCCESS')) {
            fs.unlinkSync('temp_extract.py');
            console.log('✅ Архив извлечен с помощью Python!');
            return true;
        }
    } catch (error) {
        console.log('❌ Python метод не сработал');
    }

    console.log('❌ Не удалось извлечь архив автоматически');
    console.log('💡 Рекомендация: распакуйте архив вручную и поместите файлы в папку attached_assets/');
    
    return false;
}

async function copyExistingImages() {
    console.log('📋 Проверка уже имеющихся изображений...');
    
    const attachedDir = 'attached_assets/';
    const targetDir = 'client/public/images/products/';
    
    // Создаем целевую директорию если её нет
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const files = fs.readdirSync(attachedDir);
    const imageFiles = files.filter(file => 
        file.toLowerCase().endsWith('.png') && 
        !file.includes('image_') && 
        !file.includes('bf881b0c')
    );
    
    console.log(`📁 Найдено ${imageFiles.length} изображений для копирования`);
    
    let copiedCount = 0;
    
    for (const file of imageFiles) {
        try {
            const sourcePath = path.join(attachedDir, file);
            let targetName = file;
            
            // Очищаем имена файлов от временных меток
            targetName = targetName.replace(/_\d+\.png$/, '.png');
            
            const targetPath = path.join(targetDir, targetName);
            
            // Копируем только если файл еще не существует
            if (!fs.existsSync(targetPath)) {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`✅ Скопирован: ${targetName}`);
                copiedCount++;
            } else {
                console.log(`⏭️ Уже существует: ${targetName}`);
            }
        } catch (error) {
            console.log(`❌ Ошибка копирования ${file}:`, error);
        }
    }
    
    console.log(`🎉 Скопировано ${copiedCount} новых изображений`);
    return copiedCount;
}

async function main() {
    console.log('🚀 Начинаем обработку изображений DCK...\n');
    
    // Сначала попробуем извлечь RAR
    const extracted = await extractRAR();
    
    if (extracted) {
        // Если удалось извлечь, копируем из папки извлечения
        const extractedPath = 'attached_assets/extracted_images/';
        if (fs.existsSync(extractedPath)) {
            const extractedFiles = fs.readdirSync(extractedPath);
            console.log(`📁 Извлечено файлов: ${extractedFiles.length}`);
            
            // Перемещаем файлы в attached_assets
            for (const file of extractedFiles) {
                if (file.toLowerCase().endsWith('.png')) {
                    const sourcePath = path.join(extractedPath, file);
                    const targetPath = path.join('attached_assets/', file);
                    
                    if (!fs.existsSync(targetPath)) {
                        fs.copyFileSync(sourcePath, targetPath);
                        console.log(`📂 Перемещен: ${file}`);
                    }
                }
            }
        }
    }
    
    // Копируем все доступные изображения
    await copyExistingImages();
    
    console.log('\n🏁 Обработка завершена!');
    console.log('📌 Следующий шаг: обновить базу данных с новыми путями к изображениям');
}

main().catch(console.error);