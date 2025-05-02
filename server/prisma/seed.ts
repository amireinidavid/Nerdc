import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data (optional)
  await prisma.tagsOnJournals.deleteMany({})
  await prisma.tag.deleteMany({})
  await prisma.journal.deleteMany({})
  await prisma.category.deleteMany({})
  
  console.log('Seeding database...')
  
  // Create categories
   // Create categories
   const categories = [
    { name: 'Education and Pedagogy', description: 'Research on teaching methods and educational theory' },
    { name: 'Science and Technology', description: 'Scientific research and technological innovations' },
    { name: 'Health and Medical Sciences', description: 'Medical research and healthcare studies' },
    { name: 'Agricultural Sciences', description: 'Research on agriculture, farming, and food production' },
    { name: 'Environmental Studies', description: 'Environmental science and sustainability research' },
    { name: 'Social Sciences', description: 'Sociology, psychology, and related fields' },
    { name: 'Humanities and Arts', description: 'Literature, history, philosophy, and arts research' },
    { name: 'Engineering and Applied Sciences', description: 'All fields of engineering research and applications' },
    { name: 'ICT and Digital Innovation', description: 'Computing, digital transformation, and IT research' },
    { name: 'Business, Management & Finance', description: 'Business administration, management, and financial studies' },
    { name: 'Law and Policy Studies', description: 'Legal research and policy analysis' },
    { name: 'Vocational and Technical Education', description: 'Research on skill-based and technical education' },
    { name: 'Teacher Education and Curriculum Studies', description: 'Teacher training and curriculum development research' },
    { name: 'Library and Information Science', description: 'Research on information management and library sciences' },
    { name: 'Peace, Conflict, and Security Studies', description: 'Research on conflict resolution and security' },
  ]
   // Create tags
 
  
  for (const category of categories) {
    await prisma.category.create({
      data: category,
    })
  }
  console.log('Created categories')
  
  // Create tags
 
  const tags = [
    // Education-Specific
    { name: 'Basic Education' },
    { name: 'Tertiary Education' },
    { name: 'Curriculum Development' },
    { name: 'Inclusive Education' },
    { name: 'WAEC/NECO-focused Research' },
    { name: 'Student Performance' },
    { name: 'Online Learning' },
    { name: 'E-learning' },
    { name: 'Teacher Training' },
    { name: 'Education Policy' },
    { name: 'Private vs. Public School Analysis' },
    
    // Nigeria-Specific Development Tags
    { name: 'Sustainable Development Goals' },
    { name: 'Nigerian Educational System' },
    { name: 'NYSC Research' },
    { name: 'Rural Education in Nigeria' },
    { name: 'Northern Nigeria Studies' },
    { name: 'Nigerian Languages in Education' },
    { name: 'JAMB Research' },
    { name: 'Education for Almajiri Children' },
    { name: 'Indigenous Knowledge Systems' },
    { name: 'Gender and Education in Nigeria' },
    
    // Professional & Policy-Oriented
    { name: 'National Policy on Education' },
    { name: 'UNESCO Compliance' },
    { name: 'NUC-Approved Research' },
    { name: 'Education Financing' },
    { name: 'Teaching Quality Metrics' },
    { name: 'Government Reforms in Education' },
    
    // General Research Tags
    { name: 'Quantitative Study' },
    { name: 'Qualitative Analysis' },
    { name: 'Mixed Methods' },
    { name: 'Case Study' },
    { name: 'Survey Research' },
    { name: 'Comparative Education' },
    { name: 'Data-driven Evaluation' },
    { name: 'Peer Review Pending' },
    { name: 'Published 2024' },
  ]
  for (const tag of tags) {
    await prisma.tag.create({
      data: tag,
    })
  }
  console.log('Created tags')
  
  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 