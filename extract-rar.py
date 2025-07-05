#!/usr/bin/env python3
import os
import subprocess
import sys

def extract_rar_with_python():
    """Попытка распаковать RAR с помощью Python"""
    try:
        import rarfile
        
        rar_path = "attached_assets/остальные_1751719915437.rar"
        extract_to = "attached_assets/extracted_images/"
        
        # Создаем папку для извлеченных файлов
        os.makedirs(extract_to, exist_ok=True)
        
        with rarfile.RarFile(rar_path) as rf:
            rf.extractall(extract_to)
            
        print(f"✓ RAR архив успешно распакован в {extract_to}")
        return True
        
    except ImportError:
        print("✗ Библиотека rarfile не установлена")
        return False
    except Exception as e:
        print(f"✗ Ошибка при распаковке RAR: {e}")
        return False

def extract_with_unrar():
    """Попытка распаковать с помощью unrar"""
    try:
        rar_path = "attached_assets/остальные_1751719915437.rar"
        extract_to = "attached_assets/extracted_images/"
        
        # Создаем папку для извлеченных файлов
        os.makedirs(extract_to, exist_ok=True)
        
        # Пробуем разные команды
        commands = [
            ["unrar", "x", rar_path, extract_to],
            ["rar", "x", rar_path, extract_to],
            ["7z", "x", rar_path, f"-o{extract_to}"],
            ["7za", "x", rar_path, f"-o{extract_to}"]
        ]
        
        for cmd in commands:
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    print(f"✓ RAR архив успешно распакован с помощью {cmd[0]}")
                    return True
            except (subprocess.TimeoutExpired, FileNotFoundError):
                continue
                
        return False
        
    except Exception as e:
        print(f"✗ Ошибка: {e}")
        return False

def try_alternative_extraction():
    """Альтернативные методы извлечения"""
    try:
        # Попробуем скопировать и переименовать в ZIP
        import shutil
        
        rar_path = "attached_assets/остальные_1751719915437.rar"
        zip_path = "attached_assets/temp_archive.zip"
        
        shutil.copy2(rar_path, zip_path)
        
        # Попробуем распаковать как ZIP
        import zipfile
        extract_to = "attached_assets/extracted_images/"
        os.makedirs(extract_to, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
            
        os.remove(zip_path)  # Удаляем временный файл
        print("✓ Удалось распаковать как ZIP архив")
        return True
        
    except Exception as e:
        try:
            os.remove(zip_path)
        except:
            pass
        print(f"✗ Не удалось распаковать как ZIP: {e}")
        return False

if __name__ == "__main__":
    print("Попытка распаковать RAR архив...")
    
    # Сначала пробуем внешние утилиты
    if extract_with_unrar():
        sys.exit(0)
    
    # Затем пробуем Python библиотеки
    if extract_rar_with_python():
        sys.exit(0)
        
    # В крайнем случае пробуем альтернативные методы
    if try_alternative_extraction():
        sys.exit(0)
    
    print("✗ Не удалось распаковать архив ни одним из доступных методов")
    print("Рекомендация: распакуйте архив вручную и загрузите изображения")
    sys.exit(1)