-- Dashboard Tables Migration
-- Creates tables for favorites, certificates, notifications, user_downloads, and lesson_plans

-- Favorites Table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    attachment_id UUID REFERENCES attachments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT favorites_unique_item UNIQUE(user_id, course_id, lesson_id, attachment_id),
    CONSTRAINT favorites_at_least_one_item CHECK (
        (course_id IS NOT NULL)::int + 
        (lesson_id IS NOT NULL)::int + 
        (attachment_id IS NOT NULL)::int = 1
    )
);

-- Certificates Table (apenas registro, geração futura)
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    certificate_url TEXT, -- Nullable por enquanto, será preenchido quando implementar geração
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Notifications Table (sistema completo)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'new_lesson', 'renewal_reminder', 'course_update', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Downloads Table
CREATE TABLE user_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, attachment_id)
);

-- Lesson Plans Table (funcionalidade nova)
CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de checklist items: [{"text": "...", "completed": false}]
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_course_id ON favorites(course_id);
CREATE INDEX idx_favorites_lesson_id ON favorites(lesson_id);
CREATE INDEX idx_favorites_attachment_id ON favorites(attachment_id);

CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_user_downloads_user_id ON user_downloads(user_id);
CREATE INDEX idx_user_downloads_attachment_id ON user_downloads(attachment_id);

CREATE INDEX idx_lesson_plans_user_id ON lesson_plans(user_id);
CREATE INDEX idx_lesson_plans_course_id ON lesson_plans(course_id);
CREATE INDEX idx_lesson_plans_due_date ON lesson_plans(due_date);

-- Triggers for updated_at
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON lesson_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: RLS policies are removed as they will be handled in application logic
-- The application will enforce access control in middleware and query helpers
