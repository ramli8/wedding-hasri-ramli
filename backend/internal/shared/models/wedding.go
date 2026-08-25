package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type JSONMap map[string]interface{}

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return "{}", nil
	}
	b, err := json.Marshal(j)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

func (j *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*j = JSONMap{}
		return nil
	}
	var b []byte
	switch v := value.(type) {
	case []byte:
		b = v
	case string:
		b = []byte(v)
	default:
		return errors.New("unsupported type for JSONMap")
	}
	return json.Unmarshal(b, j)
}

type Wedding struct {
	ID                  int16      `gorm:"primaryKey;default:1"`
	GroomName           string     `gorm:"type:varchar(255);not null"`
	BrideName           string     `gorm:"type:varchar(255);not null"`
	WeddingDate         *time.Time `gorm:"type:timestamptz;default:null"`
	Content             JSONMap    `gorm:"type:jsonb;default:'{}'"`
	GiftShippingAddress *string    `gorm:"type:text;default:null"`
	CreatedAt           time.Time  `gorm:"not null;default:now()"`
	UpdatedAt           time.Time  `gorm:"not null;default:now()"`
}

func (Wedding) TableName() string {
	return "weddings"
}

type WeddingCouple struct {
	ID              string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Side            string    `gorm:"type:wedding_side;not null;uniqueIndex"`
	FullName        string    `gorm:"type:varchar(255);not null"`
	Nickname        *string   `gorm:"type:varchar(100);default:null"`
	Gelar           *string   `gorm:"type:varchar(100);default:null"`
	PhotoURL        *string   `gorm:"type:text;default:null"`
	InstagramHandle *string   `gorm:"type:varchar(50);default:null"`
	CreatedAt       time.Time `gorm:"not null;default:now()"`
	UpdatedAt       time.Time `gorm:"not null;default:now()"`
}

func (WeddingCouple) TableName() string {
	return "wedding_couples"
}

type WeddingEvent struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name        string     `gorm:"type:varchar(255);not null"`
	EventDate   *time.Time `gorm:"type:timestamptz;default:null"`
	StartTime   *time.Time `gorm:"type:timestamptz;default:null"`
	EndTime     *time.Time `gorm:"type:timestamptz;default:null"`
	VenueName   *string    `gorm:"type:varchar(255);default:null"`
	AddressFull *string    `gorm:"type:text;default:null"`
	GmapsURL    *string    `gorm:"type:text;default:null"`
	Notes       *string    `gorm:"type:text;default:null"`
	IsMainEvent bool       `gorm:"not null;default:false"`
	OrderIndex  int        `gorm:"not null;default:0"`
	CreatedAt   time.Time  `gorm:"not null;default:now()"`
	UpdatedAt   time.Time  `gorm:"not null;default:now()"`
}

func (WeddingEvent) TableName() string {
	return "wedding_events"
}

type WeddingStoryEvent struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	EventDate   *string   `gorm:"type:varchar(50);default:null"`
	Title       string    `gorm:"type:varchar(255);not null"`
	Description *string   `gorm:"type:text;default:null"`
	ImageURL    *string   `gorm:"type:text;default:null"`
	OrderIndex  int       `gorm:"not null;default:0"`
	CreatedAt   time.Time `gorm:"not null;default:now()"`
	UpdatedAt   time.Time `gorm:"not null;default:now()"`
}

func (WeddingStoryEvent) TableName() string {
	return "wedding_story_events"
}

type WeddingGalleryItem struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ImageURL   string    `gorm:"type:text;not null"`
	Caption    *string   `gorm:"type:varchar(500);default:null"`
	OrderIndex int       `gorm:"not null;default:0"`
	CreatedAt  time.Time `gorm:"not null;default:now()"`
	UpdatedAt  time.Time `gorm:"not null;default:now()"`
}

func (WeddingGalleryItem) TableName() string {
	return "wedding_gallery_items"
}

type WeddingFaq struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Question   string    `gorm:"type:text;not null"`
	Answer     string    `gorm:"type:text;not null"`
	OrderIndex int       `gorm:"not null;default:0"`
	CreatedAt  time.Time `gorm:"not null;default:now()"`
	UpdatedAt  time.Time `gorm:"not null;default:now()"`
}

func (WeddingFaq) TableName() string {
	return "wedding_faqs"
}

type WeddingBankAccount struct {
	ID                string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	BankName          string    `gorm:"type:varchar(100);not null"`
	AccountNumber     string    `gorm:"type:varchar(100);not null"`
	AccountHolderName string    `gorm:"type:varchar(255);not null"`
	IsActive          bool      `gorm:"not null;default:true"`
	CreatedAt         time.Time `gorm:"not null;default:now()"`
	UpdatedAt         time.Time `gorm:"not null;default:now()"`
}

func (WeddingBankAccount) TableName() string {
	return "wedding_bank_accounts"
}

type WeddingEwallet struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ProviderName   string    `gorm:"type:varchar(100);not null"`
	AccountID      string    `gorm:"type:varchar(255);not null"`
	QrCodeImageURL *string   `gorm:"type:text;default:null"`
	IsActive       bool      `gorm:"not null;default:true"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`
	UpdatedAt      time.Time `gorm:"not null;default:now()"`
}

func (WeddingEwallet) TableName() string {
	return "wedding_ewallets"
}

type WeddingWishlistItem struct {
	ID               string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ItemName         string     `gorm:"type:varchar(255);not null"`
	ItemImageURL     *string    `gorm:"type:text;default:null"`
	ItemLink         *string    `gorm:"type:text;default:null"`
	ClaimedByGuestID *string    `gorm:"type:uuid;default:null;index"`
	ClaimedByGuest   *Guest     `gorm:"foreignKey:ClaimedByGuestID"`
	ClaimedAt        *time.Time `gorm:"type:timestamptz;default:null"`
	CreatedAt        time.Time  `gorm:"not null;default:now()"`
	UpdatedAt        time.Time  `gorm:"not null;default:now()"`
}

func (WeddingWishlistItem) TableName() string {
	return "wedding_wishlist_items"
}

type InvitationSection struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SectionKey string    `gorm:"type:varchar(50);not null;uniqueIndex"`
	IsEnabled  bool      `gorm:"not null;default:true"`
	OrderIndex int       `gorm:"not null;default:0"`
	CreatedAt  time.Time `gorm:"not null;default:now()"`
	UpdatedAt  time.Time `gorm:"not null;default:now()"`
}

func (InvitationSection) TableName() string {
	return "invitation_sections"
}

type RSVPSubmission struct {
	ID               string        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	GuestID          string        `gorm:"type:uuid;not null;index"`
	Guest            Guest         `gorm:"foreignKey:GuestID"`
	WeddingEventID   *string       `gorm:"type:uuid;default:null;index"`
	WeddingEvent     *WeddingEvent `gorm:"foreignKey:WeddingEventID"`
	AttendanceStatus string        `gorm:"type:rsvp_status;not null"`
	NumberOfGuests   int           `gorm:"not null;default:1"`
	SubmittedAt      time.Time     `gorm:"type:timestamptz;not null;default:now()"`
}

func (RSVPSubmission) TableName() string {
	return "rsvp_submissions"
}

type GuestbookEntry struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	GuestID     *string    `gorm:"type:uuid;default:null;index"`
	Guest       *Guest     `gorm:"foreignKey:GuestID"`
	GuestName   string     `gorm:"type:varchar(255);not null"`
	MessageText string     `gorm:"type:text;not null"`
	ReplyText   *string    `gorm:"type:text;default:null"`
	RepliedAt   *time.Time `gorm:"type:timestamptz;default:null"`
	IsHidden    bool       `gorm:"not null;default:false"`
	CreatedAt   time.Time  `gorm:"not null;default:now()"`
	UpdatedAt   time.Time  `gorm:"not null;default:now()"`
}

func (GuestbookEntry) TableName() string {
	return "guestbook_entries"
}

type GuestPhoto struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	GuestID   *string   `gorm:"type:uuid;default:null;index"`
	Guest     *Guest    `gorm:"foreignKey:GuestID"`
	GuestName string    `gorm:"type:varchar(255);not null"`
	PhotoURL  string    `gorm:"type:text;not null"`
	Caption   *string   `gorm:"type:varchar(500);default:null"`
	IsHidden  bool      `gorm:"not null;default:false"`
	CreatedAt time.Time `gorm:"not null;default:now()"`
	UpdatedAt time.Time `gorm:"not null;default:now()"`
}

func (GuestPhoto) TableName() string {
	return "guest_photos"
}
