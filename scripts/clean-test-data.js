const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTestData() {
  try {
    console.log('🧹 Iniciando limpieza de datos de prueba...\n');
    
    // Orden de eliminación para respetar restricciones de foreign key
    const tables = [
      'interests',
      'messages', 
      'opportunities',
      'projects',
      'user_roles',
      'users'
    ];
    
    console.log('⚠️  ATENCIÓN: Este script eliminará TODOS los datos de prueba');
    console.log('📋 Tablas a limpiar:', tables.join(', '));
    console.log('🔄 Procesando...\n');
    
    let totalDeleted = 0;
    
    for (const table of tables) {
      try {
        // Contar registros antes de eliminar
        const { count: beforeCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (beforeCount === 0) {
          console.log(`✅ ${table}: Ya está vacía`);
          continue;
        }
        
        // Eliminar todos los registros
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 'never-matches'); // Condición que coincide con todos los registros
        
        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
          console.log(`🗑️  ${table}: ${beforeCount} registros eliminados`);
          totalDeleted += beforeCount;
        }
        
      } catch (e) {
        console.log(`❌ ${table}: Error inesperado - ${e.message}`);
      }
    }
    
    console.log(`\n✨ Limpieza completada!`);
    console.log(`📊 Total de registros eliminados: ${totalDeleted}`);
    
    // Verificar que las tablas están vacías
    console.log('\n🔍 Verificando limpieza...');
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`   ${table}: ${count} registros`);
    }
    
    // Verificar que los roles por defecto siguen ahí
    const { data: rolesData } = await supabase
      .from('roles')
      .select('name');
    console.log(`   roles: ${rolesData.length} registros (${rolesData.map(r => r.name).join(', ')})`);
    
    console.log('\n🎉 Base de datos lista para nuevas pruebas!');
    
  } catch (err) {
    console.error('❌ Error general:', err.message);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  cleanTestData();
}

module.exports = cleanTestData;