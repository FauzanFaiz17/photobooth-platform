// Menyiapkan binary cameraAPI sebelum build Electron.
// - Menyalin DLL Canon (EDSDK) dari shared/ ke cameraAPI/ bila belum ada.
// - Dengan --require-canon: memastikan cameraAPI/main.exe ada (dibuat di Windows).
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appDir = join(scriptDir, '..')
const cameraDir = join(appDir, 'cameraAPI')
const edsdkDir = join(appDir, '..', '..', 'shared', 'Windows', 'EDSDK_64', 'Dll')

const requireCanon = process.argv.includes('--require-canon')
const DLLS = ['EDSDK.dll', 'EdsImage.dll']

function copyDlls() {
  for (const dll of DLLS) {
    const target = join(cameraDir, dll)
    if (existsSync(target)) {
      console.log(`[camera] ${dll} sudah ada — dilewati.`)
      continue
    }

    const source = join(edsdkDir, dll)
    if (!existsSync(source)) {
      console.error(`[camera] DLL sumber tidak ditemukan: ${source}`)
      process.exit(1)
    }

    copyFileSync(source, target)
    console.log(`[camera] Disalin: ${dll}`)
  }
}

function assertMainExe() {
  const mainExe = join(cameraDir, 'main.exe')
  if (existsSync(mainExe)) {
    console.log('[camera] main.exe ditemukan — kamera Canon akan disertakan.')
    return
  }

  console.error(
    [
      '',
      '[camera] cameraAPI/main.exe belum ada, tetapi build ini mewajibkan fitur kamera Canon.',
      '',
      'main.exe harus di-compile di Windows (EDSDK tidak tersedia untuk macOS/Linux):',
      '  1. Pasang Python 3.x di Windows.',
      '  2. cd desktop/electron-app/cameraAPI',
      '  3. pip install -r requirements.txt pyinstaller',
      '  4. node ../scripts/prepare-camera-bin.mjs   (menyalin EDSDK.dll & EdsImage.dll)',
      '  5. build.bat                                 (menghasilkan dist/main.exe)',
      '  6. Salin dist/main.exe ke cameraAPI/main.exe, lalu jalankan build lagi.',
      ''
    ].join('\n')
  )
  process.exit(1)
}

copyDlls()

if (requireCanon) {
  assertMainExe()
} else {
  console.log('[camera] Build tanpa --require-canon — fitur kamera Canon tidak diberlakukan.')
}
