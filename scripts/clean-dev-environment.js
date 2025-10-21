import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración - usar las variables de entorno o las del proyecto
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('- VITE_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (Service Role Key, NO anon key)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanDatabase() {
  console.log('🗑️ Limpiando base de datos...');
  
  try {
    // Eliminar en orden para respetar las foreign keys
    const tables = [
      'interests',
      'messages', 
      'opportunities',
      'projects',
      'user_roles',
      'users'
      // NO eliminar 'roles' porque son datos de configuración
    ];

    for (const table of tables) {
      console.log(`  📋 Eliminando datos de tabla: ${table}`);
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todo excepto IDs imposibles
      
      if (error) {
        console.error(`    ❌ Error en tabla ${table}:`, error.message);
      } else {
        console.log(`    ✅ Tabla ${table} limpiada`);
      }
    }

    // Limpiar usuarios de auth.users (esto también eliminará las referencias en cascada)
    console.log('  👥 Eliminando usuarios de autenticación...');
    
    // Obtener todos los usuarios
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('    ❌ Error listando usuarios:', listError.message);
    } else {
      for (const user of users.users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`    ❌ Error eliminando usuario ${user.email}:`, deleteError.message);
        } else {
          console.log(`    ✅ Usuario eliminado: ${user.email}`);
        }
      }
    }

    console.log('✅ Base de datos limpiada completamente');
    
  } catch (error) {
    console.error('❌ Error general limpiando base de datos:', error);
  }
}

async function cleanStorage() {
  console.log('🗂️ Limpiando almacenamiento...');
  
  try {
    // Limpiar bucket de fotos de perfil
    const bucketName = 'fotos-perfil';
    
    console.log(`  📁 Limpiando bucket: ${bucketName}`);
    
    // Listar todos los archivos en el bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list();
    
    if (listError) {
      console.error(`    ❌ Error listando archivos en ${bucketName}:`, listError.message);
      return;
    }

    if (files && files.length > 0) {
      // Crear array de paths de archivos para eliminar
      const filePaths = [];
      
      for (const file of files) {
        if (file.name) {
          filePaths.push(file.name);
          
          // Si es una carpeta, listar sus contenidos
          if (!file.name.includes('.')) {
            const { data: subFiles, error: subListError } = await supabase.storage
              .from(bucketName)
              .list(file.name);
            
            if (!subListError && subFiles) {
              for (const subFile of subFiles) {
                if (subFile.name) {
                  filePaths.push(`${file.name}/${subFile.name}`);
                }
              }
            }
          }
        }
      }

      if (filePaths.length > 0) {
        console.log(`    🗑️ Eliminando ${filePaths.length} archivos...`);
        
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove(filePaths);
        
        if (deleteError) {
          console.error(`    ❌ Error eliminando archivos:`, deleteError.message);
        } else {
          console.log(`    ✅ ${filePaths.length} archivos eliminados`);
        }
      } else {
        console.log(`    ℹ️ No hay archivos para eliminar en ${bucketName}`);
      }
    } else {
      console.log(`    ℹ️ Bucket ${bucketName} ya está vacío`);
    }

    console.log('✅ Almacenamiento limpiado completamente');
    
  } catch (error) {
    console.error('❌ Error general limpiando almacenamiento:', error);
  }
}

async function resetRoles() {
  console.log('🔄 Restableciendo roles por defecto...');
  
  try {
    // Asegurar que existen los roles básicos
    const defaultRoles = [
      { name: 'admin', description: 'Administrator with full system access' },
      { name: 'mentor', description: 'Mentor with extended privileges' },  
      { name: 'emprendedor', description: 'Entrepreneur with standard access' }
    ];

    for (const role of defaultRoles) {
      const { error } = await supabase
        .from('roles')
        .upsert(role, { onConflict: 'name' });
      
      if (error) {
        console.error(`    ❌ Error creando rol ${role.name}:`, error.message);
      } else {
        console.log(`    ✅ Rol ${role.name} restablecido`);
      }
    }

    console.log('✅ Roles restablecidos');
    
  } catch (error) {
    console.error('❌ Error restableciendo roles:', error);
  }
}

async function main() {
  console.log('🧹 LIMPIEZA COMPLETA DEL ENTORNO DE DESARROLLO');
  console.log('='.repeat(50));
  console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos');
  console.log('='.repeat(50));
  
  // Confirmar que estamos en desarrollo
  const isProduction = process.env.NODE_ENV === 'production' || 
                      supabaseUrl.includes('prod') || 
                      supabaseUrl.includes('production');
  
  if (isProduction) {
    console.error('❌ CANCELADO: Parece ser un entorno de producción');
    console.error('   Por seguridad, este script solo se ejecuta en desarrollo');
    process.exit(1);
  }

  try {
    await cleanDatabase();
    console.log('');
    await cleanStorage();
    console.log('');
    await resetRoles();
    
    console.log('');
    console.log('🎉 LIMPIEZA COMPLETADA');
    console.log('✅ Base de datos vacía');
    console.log('✅ Almacenamiento vacío');
    console.log('✅ Roles restablecidos');
    console.log('');
    console.log('🚀 El entorno está listo para desarrollo fresco');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

main();