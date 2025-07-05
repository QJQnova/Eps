
import subprocess
import sys
import os

try:
    # Установим rarfile если его нет
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'rarfile'])
    
    import rarfile
    
    # Открываем и извлекаем архив
    with rarfile.RarFile('attached_assets/остальные_1751719915437.rar') as rf:
        rf.extractall('attached_assets/extracted_images/')
    
    print("SUCCESS: RAR extracted with Python")
    
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
