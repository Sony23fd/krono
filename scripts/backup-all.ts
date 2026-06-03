import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sshConfig = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function backupDatabase() {
  console.log('Өгөгдлийн санг нөөцөлж байна (Database Backup)...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `db-backup-${timestamp}.json`);

  try {
    const categories = await prisma.category.findMany();
    const products = await prisma.product.findMany({ include: { variants: true } });
    const orders = await prisma.order.findMany({ include: { items: true, payments: true } });
    const users = await prisma.user.findMany();
    const shopSettings = await prisma.shopSettings.findMany();

    const data = {
      timestamp,
      data: { categories, products, orders, users, shopSettings }
    };

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`✅ Өгөгдлийн сан амжилттай нөөцлөгдлөө: ${backupFile}`);
  } catch (error) {
    console.error('Өгөгдлийн санг нөөцлөх үед алдаа гарлаа:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function backupUploads() {
  return new Promise((resolve, reject) => {
    console.log('Зургуудыг нөөцөлж байна (Uploads Backup)...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const remoteTarball = `/var/www/uploads-backup-${timestamp}.tar.gz`;
    const localTarball = path.join(BACKUP_DIR, `uploads-backup-${timestamp}.tar.gz`);

    const conn = new Client();

    conn.on('ready', () => {
      console.log('Сервертэй холбогдлоо. Зургуудыг архивлаж байна...');
      const cmd = `cd /var/www/bileg/public && tar -czf ${remoteTarball} uploads`;
      
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        
        stream.on('close', (code: any) => {
          if (code !== 0) {
            console.error('Архивлах үед алдаа гарлаа.');
            conn.end();
            return reject(new Error('Archive failed'));
          }

          console.log('Архив амжилттай үүслээ. Татаж авч байна...');
          conn.sftp((err, sftp) => {
            if (err) return reject(err);

            sftp.fastGet(remoteTarball, localTarball, (err) => {
              if (err) {
                console.error('Татаж авах үед алдаа гарлаа:', err);
                conn.end();
                return reject(err);
              }

              console.log(`✅ Зургууд амжилттай нөөцлөгдлөө: ${localTarball}`);
              
              // Remove remote backup to save space
              conn.exec(`rm ${remoteTarball}`, () => {
                conn.end();
                resolve(true);
              });
            });
          });
        }).stderr.on('data', (data: any) => {
          console.log('STDERR: ' + data);
        });
      });
    }).on('error', (err) => {
      console.error('SSH Connection Error:', err);
      reject(err);
    }).connect(sshConfig);
  });
}

async function main() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }

  await backupDatabase();
  await backupUploads();
  
  console.log('🎉 Бүх нөөцлөлт (Backup) амжилттай дууслаа!');
}

main();
