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
  const categories = [
    { name: 'Medicine', description: 'Medical research and healthcare studies' },
    { name: 'Engineering', description: 'All fields of engineering research' },
    { name: 'Computer Science', description: 'Computing, algorithms, and software development' },
    { name: 'Biology', description: 'Biological sciences and research' },
    { name: 'Physics', description: 'Physics research and theoretical studies' },
    { name: 'Chemistry', description: 'Chemical research and materials science' },
    { name: 'Mathematics', description: 'Mathematical research and theoretical studies' },
    { name: 'Social Sciences', description: 'Sociology, psychology, and related fields' },
    { name: 'Economics', description: 'Economic theory and applied economics' },
    { name: 'Business', description: 'Business management and administration' },
  ]
  
  for (const category of categories) {
    await prisma.category.create({
      data: category,
    })
  }
  console.log('Created categories')
  
  // Create tags
  const tags = [
    { name: 'Artificial Intelligence' },
    { name: 'Machine Learning' },
    { name: 'Quantum Computing' },
    { name: 'Genetics' },
    { name: 'Climate Change' },
    { name: 'Renewable Energy' },
    { name: 'Neuroscience' },
    { name: 'Economics' },
    { name: 'Sustainability' },
    { name: 'Public Health' },
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