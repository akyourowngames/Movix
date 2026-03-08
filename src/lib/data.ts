export interface Movie {
    id: string;
    title: string;
    hindiTitle?: string;
    poster: string;
    backdrop: string;
    genre: string[];
    year: number;
    duration: string;
    rating: number;
    quality: string;
    description: string;
    imdb_id?: string;
}

export const MOVIE_DATA: Record<string, Movie[]> = {
    trending: [
        {
            id: "t1",
            title: "Jawan",
            hindiTitle: "जवान",
            poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
            backdrop: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=600&fit=crop",
            genre: ["Action", "Thriller"],
            year: 2023,
            duration: "2h 49m",
            rating: 8.5,
            quality: "4K",
            description: "A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society."
        },
        {
            id: "t2",
            title: "Animal",
            hindiTitle: "एनिमल",
            poster: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&h=600&fit=crop",
            backdrop: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=1200",
            genre: ["Action", "Drama"],
            year: 2023,
            duration: "3h 21m",
            rating: 7.9,
            quality: "HD",
            description: "A son's obsessive love for his father creates a violent world of vengeance."
        },
        {
            id: "t3",
            title: "Pathaan",
            hindiTitle: "पठान",
            poster: "https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=400&h=600&fit=crop",
            backdrop: "https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=1200",
            genre: ["Action", "Spy"],
            year: 2023,
            duration: "2h 26m",
            rating: 7.2,
            quality: "4K",
            description: "An Indian spy races against time to stop an outfit from executing a deadly attack on India."
        },
        {
            id: "t4",
            title: "Rockstar",
            hindiTitle: "रॉकस्टार",
            poster: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&h=600&fit=crop",
            backdrop: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=1200",
            genre: ["Music", "Romance"],
            year: 2011,
            duration: "2h 39m",
            rating: 7.7,
            quality: "HD",
            description: "A college student strives to become a singer, suffering through heartbreak to discover his true art."
        },
        {
            id: "t5",
            title: "Gangs of Wasseypur",
            hindiTitle: "गैंग्स ऑफ वासेपुर",
            poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=600&fit=crop",
            backdrop: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1200",
            genre: ["Crime", "Action"],
            year: 2012,
            duration: "5h 21m",
            rating: 8.2,
            quality: "HD",
            description: "A clash between Sultan and Shahid Khan leads to the expulsion of Khan from Wasseypur, igniting a deadly blood feud spanning three generations."
        }
    ],
    newReleases: [
        {
            id: "n1",
            title: "Fighter",
            hindiTitle: "फाइटर",
            poster: "https://images.unsplash.com/photo-1474314881477-04c4aaf42010?w=400&h=600&fit=crop",
            backdrop: "https://images.unsplash.com/photo-1474314881477-04c4aaf42010?w=1200",
            genre: ["Action", "War"],
            year: 2024,
            duration: "2h 46m",
            rating: 7.8,
            quality: "4K",
            description: "Top IAF aviators come together in the face of imminent danger to form Air Dragons."
        },
        {
            id: "n2",
            title: "Dunki",
            hindiTitle: "डंकी",
            poster: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400&h=600&fit=crop",
            backdrop: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200",
            genre: ["Comedy", "Drama"],
            year: 2023,
            duration: "2h 41m",
            rating: 7.5,
            quality: "HD",
            description: "Four friends from a village in Punjab share a common dream: to go to England."
        }
    ]
};
